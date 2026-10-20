import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdCampaign from "@/models/AdCampaign";
import { checkRBAC } from "@/lib/rbac";
import { topupCampaignBudget } from "@/services/metaAdsEngine.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/panel/ads/campaigns/[id]/topup
 * Increases the budget and/or duration of an active campaign using wallet credits
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { additionalBudget, additionalDays = 0 } = body;

    const topupAmount = Number(additionalBudget);
    if (!topupAmount || topupAmount <= 0) {
      return NextResponse.json({ success: false, error: "Top-up amount must be greater than 0" }, { status: 400 });
    }

    await dbConnect();

    const campaign = await AdCampaign.findOne({
      _id: id,
      owner_user_id: context!.userId,
    });

    if (!campaign && context!.role !== "admin") {
      return NextResponse.json({ success: false, error: "Campaign not found or unauthorized" }, { status: 404 });
    }

    const updated = await topupCampaignBudget(id, topupAmount, Number(additionalDays));

    return NextResponse.json({
      success: true,
      message: `Successfully added ₹${topupAmount.toLocaleString("en-IN")} to campaign budget!`,
      campaign: updated,
    });
  } catch (error: any) {
    console.error("[POST /api/panel/ads/campaigns/[id]/topup] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
