import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdLeadCrm from "@/models/AdLeadCrm";
import { checkRBAC } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/panel/ads/leads/[id]
 * Updates lead status or follow-up notes in Builder's CRM
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { crm_status, builder_remarks } = body;

    await dbConnect();

    const lead = await AdLeadCrm.findOne({
      _id: id,
      owner_user_id: context!.userId,
    });

    if (!lead && context!.role !== "admin") {
      return NextResponse.json({ success: false, error: "Lead not found or unauthorized" }, { status: 404 });
    }

    if (crm_status) lead.crm_status = crm_status;
    if (builder_remarks !== undefined) lead.builder_remarks = builder_remarks;

    await lead.save();

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      lead,
    });
  } catch (error: any) {
    console.error("[PATCH /api/panel/ads/leads/[id]] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
