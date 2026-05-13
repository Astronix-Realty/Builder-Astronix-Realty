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

    console.log(`[BULK PATCH] Request: ${unitIds.length} units -> status="${status}", propertyId=${propertyId}`);
    console.log(`[BULK PATCH] Unit IDs sample:`, unitIds.slice(0, 3));

    await dbConnect();

    // --- Step 1: Try standalone Unit collection ---
    // Filter valid ObjectIds for _id query to avoid cast errors
    const validObjectIds = unitIds.filter((id: string) => mongoose.isValidObjectId(id));
    
    let standaloneModified = 0;
    if (validObjectIds.length > 0 || unitIds.length > 0) {
      const query: any = { builderId: decoded.userId, $or: [] };
      if (validObjectIds.length > 0) {
        query.$or.push({ _id: { $in: validObjectIds } });
      }
      // Always check originalId with ALL unitIds (these are string matches)
      query.$or.push({ originalId: { $in: unitIds } });

      const result = await Unit.updateMany(query, { $set: { status, updatedBy: decoded.userId } });
      standaloneModified = result.modifiedCount;
      console.log(`[BULK PATCH] Standalone Unit.updateMany matched=${result.matchedCount}, modified=${standaloneModified}`);
    }

    // --- Step 2: ALWAYS try embedded update in Property.details ---
    let embeddedModified = 0;
    if (propertyId) {
      // Find the property - try direct ID first, then check child properties
      let property = null;
      if (mongoose.isValidObjectId(propertyId)) {
        property = await Property.findOne({ _id: propertyId, builderId: decoded.userId });
      }

      if (property) {
        console.log(`[BULK PATCH] Found property ${propertyId}, type=${property.type}, has generatedUnits=${!!property.details?.generatedUnits}, count=${property.details?.generatedUnits?.length || 0}`);
        
        if (property.details?.generatedUnits && property.details.generatedUnits.length > 0) {
          const units = property.details.generatedUnits;
          
          property.details.generatedUnits = units.map((u: any) => {
            // Check ALL possible ID fields against the requested unitIds
            const possibleIds = [u.id, u.originalId, u._id?.toString()].filter(Boolean);
            const isMatch = possibleIds.some((pid: string) => unitIds.includes(pid));
            
            if (isMatch) {
              embeddedModified++;
              return {
                ...u,
                status,
                customerName: status === "available" ? "" : u.customerName,
                customerPhone: status === "available" ? "" : u.customerPhone,
                bookingAmount: status === "available" ? 0 : u.bookingAmount,
                updatedAt: new Date().toISOString()
              };
            }
            return u;
          });

          if (embeddedModified > 0) {
            property.markModified('details');
            await property.save();
            console.log(`[BULK PATCH] Saved ${embeddedModified} embedded units in property ${propertyId}`);
          } else {
            console.log(`[BULK PATCH] No embedded unit IDs matched. First unit in DB:`, JSON.stringify(units[0]?.id || units[0]?._id));
          }
        }
      } else {
        console.log(`[BULK PATCH] Property ${propertyId} not found in DB`);
      }
    }

    // Trigger pricing aggregation (best-effort)
    if (standaloneModified > 0) {
      const updatedUnits = await Unit.find(
        { $or: [{ _id: { $in: validObjectIds } }, { originalId: { $in: unitIds } }], builderId: decoded.userId }
      ).select("towerId").lean();
      const towerIds = Array.from(new Set(updatedUnits.map(u => u.towerId?.toString()).filter(Boolean)));
      Promise.allSettled(towerIds.map(id => aggregateTowerPricing(id))).catch(err =>
        console.error("Pricing aggregation error after bulk update:", err)
      );
    }

    const totalModified = standaloneModified + embeddedModified;
    console.log(`[BULK PATCH] Done. standalone=${standaloneModified}, embedded=${embeddedModified}, total=${totalModified}`);

    return NextResponse.json({ success: true, count: totalModified }, { status: 200 });

  } catch (error: any) {
    console.error("Bulk update units error:", error);
    return NextResponse.json({ error: "Failed to update units in bulk" }, { status: 500 });
  }
}
