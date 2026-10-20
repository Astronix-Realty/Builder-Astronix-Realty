import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdCampaign from "@/models/AdCampaign";
import AdWallet from "@/models/AdWallet";
import AdWalletTransaction from "@/models/AdWalletTransaction";
import Property from "@/models/Property";
import { checkRBAC } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/panel/ads/campaigns
 * Returns all campaigns created by the logged-in Builder/Mandate
 */
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const campaigns = await AdCampaign.find({ owner_user_id: context!.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      campaigns,
    });
  } catch (error: any) {
    console.error("[GET /api/panel/ads/campaigns] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/panel/ads/campaigns/create
 * Creates a new Ad Campaign with strict validation:
 * - Rule 1: Profile Isolation (property must be owned by current user)
 * - Rule 2: Strictly PUBLISHED properties only (403 if draft/pending/unpublished)
 * - Rule 3: Multi-Level hierarchy data binding
 * - Financial: Locks budget in locked_escrow_balance
 */
export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      root_property_id,
      target_hierarchy_level = "WHOLE_PROPERTY",
      target_phase_id,
      target_tower_id,
      target_unit_id,
      hierarchy_breadcrumb,
      property_snapshot_json,
      landing_deep_link_url,
      campaign_objective = "INSTANT_LEAD_FORM",
      ad_format = "SINGLE_VIDEO",
      media_files_json = [],
      primary_text,
      headline,
      short_description,
      cta_button_type = "LEARN_MORE",
      audience_preset_id,
      custom_targeting_json,
      lead_form_questions_json = [],
      whatsapp_number,
      total_builder_budget, // e.g., 7000
      duration_days = 7,
      as_draft = false,
    } = body;

    const budget = Number(total_builder_budget);
    const minBudget = Number(process.env.MIN_CAMPAIGN_BUDGET_INR || 2000);
    if (!budget || budget < minBudget) {
      return NextResponse.json(
        { success: false, error: `Minimum campaign budget is ₹${minBudget.toLocaleString("en-IN")}` },
        { status: 400 }
      );
    }

    if (!root_property_id) {
      return NextResponse.json({ success: false, error: "Root property ID is required" }, { status: 400 });
    }

    if (!primary_text || !headline) {
      return NextResponse.json(
        { success: false, error: "Primary Text (caption) and Headline are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // RULE 1: Profile Isolation & Verification
    const property = await Property.findOne({
      _id: root_property_id,
      isDeleted: { $ne: true },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    const currentUserId = context!.userId.toString();
    const isOwner =
      property.builderId?.toString() === currentUserId ||
      property.accountId?.toString() === currentUserId ||
      property.createdBy?.toString() === currentUserId;

    if (!isOwner && context!.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You can only create ads for your own properties." },
        { status: 403 }
      );
    }

    // RULE 2: Strictly "PUBLISHED" Properties Only
    const propStatus = (property.status || "").toLowerCase();
    const isPublished = propStatus === "published" || propStatus === "active";
    if (!isPublished && context!.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "403 Forbidden: Only PUBLISHED properties can be promoted. Kripya pehle property ko publish karwayein.",
        },
        { status: 403 }
      );
    }

    // Check Wallet Balance (only required if NOT saving as draft)
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

    if (!as_draft) {
      if (availableBal < budget) {
        const shortfall = budget - availableBal;
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient wallet balance. You have ₹${availableBal.toLocaleString("en-IN")}, need ₹${shortfall.toLocaleString("en-IN")} more to launch this ad.`,
            shortfall,
            available_balance: availableBal,
          },
          { status: 402 }
        );
      }

      // 3-Tier Escrow Balance Lock:
      // Move budget from available_balance -> locked_escrow_balance
      wallet.available_balance = availableBal - budget;
      wallet.locked_escrow_balance = (wallet.locked_escrow_balance || 0) + budget;
      await wallet.save();
    }

    // Financial split: 10% platform fee, 90% net meta budget
    const commissionPercent = Number(process.env.DEFAULT_PLATFORM_COMMISSION_PERCENT || 10);
    const commissionAmount = Math.round((budget * commissionPercent) / 100);
    const netMetaBudget = budget - commissionAmount;

    // Generate Campaign Code (e.g. AST-AD-1001)
    const count = await AdCampaign.countDocuments();
    const campaignCode = `AST-AD-${String(count + 1001).padStart(4, "0")}`;

    const startDate = new Date();
    const endDate = new Date(Date.now() + Number(duration_days) * 24 * 60 * 60 * 1000);

    const visitorBaseUrl = (
      process.env.VISITOR_PANEL_URL ||
      process.env.NEXT_PUBLIC_VISITOR_PANEL_URL ||
      (process.env.NODE_ENV === "production" ? "https://astronixrealty.com" : "http://localhost:3002")
    ).replace(/\/$/, "");

    const initialStatus = as_draft ? "DRAFT" : "PENDING_ADMIN_APPROVAL";

    const campaign = await AdCampaign.create({
      campaign_code: campaignCode,
      owner_user_id: context!.userId,
      owner_role: context!.role === "mandate" ? "MANDATE" : "BUILDER",
      root_property_id,
      target_hierarchy_level,
      target_phase_id: target_phase_id || null,
      target_tower_id: target_tower_id || null,
      target_unit_id: target_unit_id || null,
      hierarchy_breadcrumb: hierarchy_breadcrumb || property.name,
      property_snapshot_json: property_snapshot_json || {},
      landing_deep_link_url: landing_deep_link_url || `${visitorBaseUrl}/township/${property.slug || property._id}`,
      campaign_objective,
      ad_format,
      media_files_json,
      primary_text,
      headline,
      short_description: short_description || null,
      cta_button_type,
      audience_preset_id: audience_preset_id || null,
      custom_targeting_json: custom_targeting_json || {},
      lead_form_questions_json,
      whatsapp_number: whatsapp_number || null,
      total_builder_budget: budget,
      platform_commission_percent: commissionPercent,
      platform_commission_amount: commissionAmount,
      net_meta_budget: netMetaBudget,
      duration_days: Number(duration_days),
      start_date: startDate,
      end_date: endDate,
      status: initialStatus,
      execution_mode: process.env.ADS_EXECUTION_MODE === "LIVE_META_API" ? "LIVE_META_API" : "LOCAL_SIMULATION",
    });

    if (!as_draft) {
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
        payment_reference_id: `LOCK_${campaignCode}`,
        notes: `Escrow lock of ₹${budget.toLocaleString("en-IN")} for campaign ${campaignCode} (${property.name})`,
      });
    }

    return NextResponse.json({
      success: true,
      message: as_draft
        ? `Ad campaign ${campaignCode} saved as Draft! Aap kabhi bhi Campaigns list se budget add karke ise LIVE kar sakte hain.`
        : `Ad submitted for Admin Approval! ₹${budget.toLocaleString("en-IN")} has been locked in escrow.`,
      campaign,
    });
  } catch (error: any) {
    console.error("[POST /api/panel/ads/campaigns/create] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
