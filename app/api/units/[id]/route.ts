import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import User from "@/models/User";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { aggregateTowerPricing } from "@/lib/services/pricing-sync";


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { status, customerName, customerPhone, bookingAmount, bookingDate, price, basePrice, allInclusivePrice, ratePerSqft, area, carpetArea, builtUpArea } = body;

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    await dbConnect();

    let ownershipQuery = getOwnershipQuery(context!);
    if (context!.role === "teamLeader") {
      const leaderDoc = await User.findById(context!.userId).lean();
      if (!leaderDoc || leaderDoc.profile?.propertyId !== propertyId) {
        return NextResponse.json({ error: "Unauthorized update for this property" }, { status: 403 });
      }
      ownershipQuery = {};
    }

    const setObj: any = {
      status, 
      customerName, 
      customerPhone, 
      bookingAmount, 
      bookingDate,
      updatedBy: context!.userId
    };
    if (status === 'reserved') {
      setObj.holdExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    if (price !== undefined) setObj.price = price;
    if (basePrice !== undefined) setObj.basePrice = basePrice;
    if (allInclusivePrice !== undefined) setObj.allInclusivePrice = allInclusivePrice;
    if (ratePerSqft !== undefined) setObj.ratePerSqft = ratePerSqft;
    if (area !== undefined) setObj.area = area;
    if (carpetArea !== undefined) setObj.carpetArea = carpetArea;
    if (builtUpArea !== undefined) setObj.builtUpArea = builtUpArea;

    // 1. Try to find and update the standalone unit document
    let unit = await Unit.findOneAndUpdate(
      { 
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : new mongoose.Types.ObjectId() }, 
          { originalId: id },
          { id: id }
        ], 
        ...ownershipQuery
      },
      { 
        $set: setObj 
      },
      { new: true }
    );

    // 2. Also search and update inside Property details.generatedUnits (covers embedded units)
    if (propertyId) {
      let property = await Property.findOne({ 
        _id: mongoose.isValidObjectId(propertyId) ? propertyId : null,
        ...ownershipQuery
      });

      if (property && property.details?.generatedUnits) {
        const units = property.details.generatedUnits;
        console.log(`[API] Searching embedded units in property ${propertyId}. Count: ${units.length} for ID: ${id}`);
        
        const unitIndex = units.findIndex((u: any) => {
            const uTowerId = u.towerId?.toString() || u.parentId?.toString() || propertyId;
            const fallbackId = `${uTowerId}-${u.unitNumber}-${u.floorNumber}`;
            const uId = u.id || u.originalId || u._id?.toString() || fallbackId;
            return uId === id || u.id === id || u.originalId === id || u._id?.toString() === id || String(u.unitNumber) === id;
         });
        
        if (unitIndex !== -1) {
          console.log(`[API] Found embedded unit at index ${unitIndex}. Updating to status: ${status}...`);
          // Update the unit in the array
          units[unitIndex] = {
            ...units[unitIndex],
            status: status || units[unitIndex].status,
            customerName: customerName !== undefined ? customerName : units[unitIndex].customerName,
            customerPhone: customerPhone !== undefined ? customerPhone : units[unitIndex].customerPhone,
            bookingAmount: bookingAmount !== undefined ? bookingAmount : units[unitIndex].bookingAmount,
            bookingDate: bookingDate !== undefined ? bookingDate : units[unitIndex].bookingDate,
            holdExpiresAt: status === 'reserved' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
            updatedAt: new Date().toISOString()
          };
          if (price !== undefined) units[unitIndex].price = price;
          if (basePrice !== undefined) units[unitIndex].basePrice = basePrice;
          if (allInclusivePrice !== undefined) units[unitIndex].allInclusivePrice = allInclusivePrice;
          if (ratePerSqft !== undefined) units[unitIndex].ratePerSqft = ratePerSqft;
          if (area !== undefined) units[unitIndex].area = area;
          if (carpetArea !== undefined) units[unitIndex].carpetArea = carpetArea;
          if (builtUpArea !== undefined) units[unitIndex].builtUpArea = builtUpArea;

          // Mark details and generatedUnits as modified for Mongoose
          property.details.generatedUnits = units;
          property.markModified('details.generatedUnits');
          property.markModified('details');
          await property.save();
          console.log(`[API] Property saved successfully with updated unit status: ${status}`);
          
          if (!unit) {
            unit = units[unitIndex]; // For the response
          }
        } else {
          console.log(`[API] Unit ${id} not found in property details.`);
        }
      }
    }

    if (!unit) {
      return NextResponse.json({ error: "Unit not found or unauthorized" }, { status: 404 });
    }

    // Trigger pricing aggregation for the affected tower
    if (unit.towerId) {
      aggregateTowerPricing(unit.towerId).catch(err => 
        console.error(`Error triggering pricing aggregation after updating unit ${id}:`, err)
      );
    }

    return NextResponse.json({ success: true, unit }, { status: 200 });

  } catch (error: any) {
    console.error("Update unit error:", error);
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}
