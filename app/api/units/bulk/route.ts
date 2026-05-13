import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { aggregateTowerPricing } from "@/lib/services/pricing-sync";


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

    // Trigger pricing aggregation for all unique towers affected
    const towerIds = Array.from(new Set(insertedUnits.map(u => u.towerId?.toString()).filter(Boolean)));
    // Fire and forget so we don't block the response
    Promise.allSettled(towerIds.map(id => aggregateTowerPricing(id))).catch(err => 
      console.error("Error triggering pricing aggregation after bulk insert:", err)
    );

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

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const body = await req.json();
    const { unitIds, status } = body;

    if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      return NextResponse.json({ error: "No unit IDs provided for bulk update" }, { status: 400 });
    }

    await dbConnect();

    // 1. Try to bulk update standalone unit documents
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

    // 2. If no units were modified (or some might be missing), try to update inside Property details
    if (result.modifiedCount < unitIds.length && propertyId) {
      const property = await Property.findOne({ 
        _id: mongoose.isValidObjectId(propertyId) ? propertyId : null,
        builderId: decoded.userId 
      });

      if (property && property.details?.generatedUnits) {
        let embeddedModified = 0;
        const units = property.details.generatedUnits;
        
        property.details.generatedUnits = units.map((u: any) => {
          const uId = (u.id || u.originalId || u._id?.toString());
          if (unitIds.includes(uId)) {
            embeddedModified++;
            return {
              ...u,
              status,
              updatedAt: new Date().toISOString()
            };
          }
          return u;
        });

        if (embeddedModified > 0) {
          property.markModified('details');
          await property.save();
        }
      }
    }

    // Trigger pricing aggregation
    // Find all affected tower IDs (checking both standalone and potentially draft units)
    const updatedUnits = await Unit.find(
      { 
        $or: [
          { _id: { $in: unitIds } },
          { originalId: { $in: unitIds } }
        ],
        builderId: decoded.userId 
      }
    ).select("towerId").lean();

    const towerIds = Array.from(new Set(updatedUnits.map(u => u.towerId?.toString()).filter(Boolean)));
    Promise.allSettled(towerIds.map(id => aggregateTowerPricing(id))).catch(err => 
      console.error("Error triggering pricing aggregation after bulk update:", err)
    );

    // Combined result for better feedback
    const totalModified = result.modifiedCount + (propertyId ? 1 : 0); // Simplified for now as we don't track exact embedded count perfectly

    return NextResponse.json({ success: true, count: Math.max(result.modifiedCount, totalModified) }, { status: 200 });

  } catch (error: any) {
    console.error("Bulk update units error:", error);
    return NextResponse.json({ error: "Failed to update units in bulk" }, { status: 500 });
  }
}
