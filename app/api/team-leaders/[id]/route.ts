import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { checkRBAC } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// DELETE /api/team-leaders/[id] — Remove a team leader
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ["builder"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const builderId = context!.builderId || context!.userId;

    // Find and verify the team leader belongs to this builder
    const leader = await User.findOne({
      _id: id,
      role: "teamLeader",
      builderId: builderId,
    });

    if (!leader) {
      return NextResponse.json(
        { error: "Team Leader not found or unauthorized" },
        { status: 404 }
      );
    }

    // Soft delete (mark as deleted)
    leader.isDeleted = true;
    leader.status = "suspended";
    await leader.save();

    return NextResponse.json({
      success: true,
      message: "Team Leader removed successfully",
    });
  } catch (error: any) {
    console.error("Error removing team leader:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
