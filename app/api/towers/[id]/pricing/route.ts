import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Unit from "@/models/Unit";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: towerId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { ratePerSqft } = body;

    if (!ratePerSqft || isNaN(parseFloat(ratePerSqft))) {
      return NextResponse.json({ error: "Invalid rate provided" }, { status: 400 });
    }

    await dbConnect();

    // 1. Fetch all units for this tower to calculate new prices based on their individual areas
    const units = await Unit.find({ towerId, builderId: decoded.userId });
    
    if (units.length === 0) {
        return NextResponse.json({ error: "No units found for this tower" }, { status: 404 });
    }

    // 2. Perform bulk update
    const bulkOps = units.map((u: any) => ({
      updateOne: {
        filter: { _id: u._id },
        update: { 
          $set: { 
            price: Math.round((u.area || 0) * parseFloat(ratePerSqft)),
            ratePerSqft: parseFloat(ratePerSqft),
            updatedBy: decoded.userId
          } 
        }
      }
    }));

    const result = await Unit.bulkWrite(bulkOps);

    return NextResponse.json({ 
        success: true, 
        message: `Updated pricing for ${result.modifiedCount} units`,
        count: result.modifiedCount 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Tower pricing update error:", error);
    return NextResponse.json({ error: "Failed to update tower pricing" }, { status: 500 });
  }
}
