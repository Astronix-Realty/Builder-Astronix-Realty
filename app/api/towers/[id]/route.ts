import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Tower from "@/models/Tower";
import Unit from "@/models/Unit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Trigger findOneAndDelete so the pre-hook cascades the Units
    const deletedTower = await Tower.findOneAndDelete({ _id: params.id });

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
