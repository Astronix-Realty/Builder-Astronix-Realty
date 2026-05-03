import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Unit from "@/models/Unit";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { units } = body;

    // Fast fail
    if (!units || !Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ error: "No units provided for bulk insertion" }, { status: 400 });
    }

    await dbConnect();

    // Attach builder context implicitly and clean up the object for insertMany
    const unitsToInsert = units.map((u: any) => ({
      type: "unit",
      unitNumber: u.unitNumber,
      parentId: u.parentId || u.towerId, // towerId is the parent
      towerId: u.towerId,
      projectId: u.projectId,
      floorNumber: u.floorNumber || u.floor,
      configuration: u.configuration || u.type,
      area: u.area || u.carpetArea,
      price: u.price,
      facing: u.facing,
      location: u.location || {},
      status: u.status || "available",
      // Metadata
      builderId: decoded.userId,
      createdBy: decoded.userId,
      updatedBy: decoded.userId,
    }));

    // Perform bulk insertion
    // Use ordered: false so if one fails (e.g., unique constraint), others might still succeed, 
    // though dropping the whole batch on error is safer explicitly. Let's use ordered: true (default) for atomicity
    const insertedUnits = await Unit.insertMany(unitsToInsert, { ordered: true });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[POST /api/units/bulk] inserted ${insertedUnits.length} units.`);
    }

    return NextResponse.json({ success: true, count: insertedUnits.length }, { status: 201 });
  } catch (error: any) {
    console.error("Bulk create units error:", error);
    return NextResponse.json({ error: "Failed to create units in bulk" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { unitIds, status } = body;

    if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      return NextResponse.json({ error: "No unit IDs provided for bulk update" }, { status: 400 });
    }

    await dbConnect();

    // Use bulk update
    const result = await Unit.updateMany(
      { 
        $or: [
          { _id: { $in: unitIds } },
          { originalId: { $in: unitIds } }
        ],
        builderId: decoded.userId 
      },
      { $set: { status, updatedBy: decoded.userId } }
    );

    return NextResponse.json({ success: true, count: result.modifiedCount }, { status: 200 });
  } catch (error: any) {
    console.error("Bulk update units error:", error);
    return NextResponse.json({ error: "Failed to update units in bulk" }, { status: 500 });
  }
}
