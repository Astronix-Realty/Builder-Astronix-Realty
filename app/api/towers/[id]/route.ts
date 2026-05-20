import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
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

    // Trigger findOneAndDelete so the pre-hook cascades the Units
    const deletedTower = await Tower.findOneAndDelete({ 
      _id: id,
      ...getOwnershipQuery(context!)
    });

    if (!deletedTower) {
      return NextResponse.json({ error: "Tower not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Tower and related Units deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete Tower Error:", error);
    return NextResponse.json(
      { error: "Failed to delete tower" },
      { status: 500 }
    );
  }
}
