import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdCampaign from "@/models/AdCampaign";
import AdWallet from "@/models/AdWallet";
import AdWalletTransaction from "@/models/AdWalletTransaction";
import { checkRBAC } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * POST /api/panel/ads/campaigns/[id]/activate
 * Activates a DRAFT ad campaign by locking budget from available wallet balance into escrow
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    await dbConnect();

    const campaign = await AdCampaign.findOne({
      _id: id,
      owner_user_id: context!.userId,
    });

    if (!campaign && context!.role !== "admin") {
      return NextResponse.json({ success: false, error: "Campaign not found or unauthorized" }, { status: 404 });
    }

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: `Campaign is already in status: ${campaign.status}` },
        { status: 400 }
      );
    }

    const budget = Number(campaign.total_builder_budget);

    // Fetch user wallet
    let wallet = await AdWallet.findOne({ owner_user_id: context!.userId });
    if (!wallet) {
      wallet = await AdWallet.create({
        owner_user_id: context!.userId,
        owner_role: context!.role === "mandate" ? "MANDATE" : "BUILDER",
        available_balance: 0,
        locked_escrow_balance: 0,
        lifetime_spent_balance: 0,
      });
    }

    const availableBal = wallet.available_balance || 0;
    if (availableBal < budget) {
      const shortfall = budget - availableBal;
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient wallet balance. You have ₹${availableBal.toLocaleString("en-IN")}, need ₹${shortfall.toLocaleString("en-IN")} more to activate this ad.`,
          shortfall,
          available_balance: availableBal,
        },
        { status: 402 }
      );
    }

    // Lock budget in escrow
    wallet.available_balance = availableBal - budget;
    wallet.locked_escrow_balance = (wallet.locked_escrow_balance || 0) + budget;
    await wallet.save();

    // Transition campaign status
    campaign.status = "PENDING_ADMIN_APPROVAL";
    campaign.start_date = new Date();
    campaign.end_date = new Date(Date.now() + Number(campaign.duration_days || 7) * 24 * 60 * 60 * 1000);
    await campaign.save();

    // Record Escrow Lock Transaction
    await AdWalletTransaction.create({
      wallet_id: wallet._id,
      owner_user_id: context!.userId,
      campaign_id: campaign._id,
      transaction_type: "CAMPAIGN_LOCK",
      credit_amount: -budget,
      gst_amount: 0,
      total_gateway_paid: 0,
      payment_mode: "LOCAL_MOCK_TEST",
      payment_reference_id: `LOCK_${campaign.campaign_code}`,
      notes: `Escrow lock of ₹${budget.toLocaleString("en-IN")} for activating draft campaign ${campaign.campaign_code}`,
    });

    return NextResponse.json({
      success: true,
      message: `Campaign ${campaign.campaign_code} activated! ₹${budget.toLocaleString("en-IN")} locked in escrow. Sent for Admin Approval.`,
      campaign,
    });
  } catch (error: any) {
    console.error("[POST /api/panel/ads/campaigns/[id]/activate] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
