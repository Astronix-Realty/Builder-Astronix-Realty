import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Unit from "@/models/Unit";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { status, customerName, customerPhone, bookingAmount, bookingDate } = body;

    await dbConnect();

    // Find and update the unit. Ensure it belongs to the builder.
    const unit = await Unit.findOneAndUpdate(
      { [id.length === 24 ? '_id' : 'originalId']: id, builderId: decoded.userId },
      { 
        $set: { 
          status, 
          customerName, 
          customerPhone, 
          bookingAmount, 
          bookingDate,
          updatedBy: decoded.userId
        } 
      },
      { new: true }
    );

    if (!unit) {
      return NextResponse.json({ error: "Unit not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, unit }, { status: 200 });
  } catch (error: any) {
    console.error("Update unit error:", error);
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}
