import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import Tower from "@/models/Tower";
import Unit from "@/models/Unit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Trigger findOneAndDelete so the pre-hook cascades
    const deletedProject = await Project.findOneAndDelete({ _id: params.id });

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
