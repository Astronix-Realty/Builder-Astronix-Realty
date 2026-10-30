import { checkRBAC } from "@/lib/rbac";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdAudiencePreset from "@/models/AdAudiencePreset";
import { seedDefaultAudiencePresets } from "@/services/metaAdsEngine.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/panel/ads/presets
 * Returns active pre-tested audience presets for real estate buyers
 */
export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    await dbConnect();
    await seedDefaultAudiencePresets();

    const presets = await AdAudiencePreset.find({ is_active: true }).sort({ createdAt: 1 }).lean();

    return NextResponse.json({
      success: true,
      presets,
    });
  } catch (error: any) {
    console.error("[GET /api/panel/ads/presets] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
