import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import Tower from "@/models/Tower";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    // Trigger findOneAndDelete so the pre-hook cascades
    const deletedProject = await Project.findOneAndDelete({ 
      _id: id,
      ...getOwnershipQuery(context!)
    });

    if (!deletedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Project and related Towers/Units deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete Project Error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
