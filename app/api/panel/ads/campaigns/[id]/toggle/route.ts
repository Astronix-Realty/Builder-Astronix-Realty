import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdCampaign from "@/models/AdCampaign";
import { checkRBAC } from "@/lib/rbac";
import { toggleCampaignStatus } from "@/services/metaAdsEngine.service";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/panel/ads/campaigns/[id]/toggle
 * Allows Builder/Mandate to pause or resume their running campaign
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { targetStatus } = body; // 'ACTIVE_RUNNING' or 'PAUSED_BY_USER'

    await dbConnect();

    const campaign = await AdCampaign.findOne({
      _id: id,
      owner_user_id: context!.userId,
    });

    if (!campaign && context!.role !== "admin") {
      return NextResponse.json({ success: false, error: "Campaign not found or unauthorized" }, { status: 404 });
    }

    const updated = await toggleCampaignStatus(id, targetStatus, context!.userId);

    return NextResponse.json({
      success: true,
      message: `Campaign status updated to ${updated.status}`,
      campaign: updated,
    });
  } catch (error: any) {
    console.error("[PATCH /api/panel/ads/campaigns/[id]/toggle] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
