import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { aggregateTowerPricing } from "@/lib/services/pricing-sync";


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { status, customerName, customerPhone, bookingAmount, bookingDate, price, ratePerSqft } = body;

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    await dbConnect();

    let ownershipQuery = getOwnershipQuery(context!);
    if (context!.role === "builder") {
      ownershipQuery = { builderId: context!.userId, role: { $ne: 'mandate' } };
    }

    const setObj: any = {
      status, 
      customerName, 
      customerPhone, 
      bookingAmount, 
      bookingDate,
      updatedBy: context!.userId
    };
    if (price !== undefined) setObj.price = price;
    if (ratePerSqft !== undefined) setObj.ratePerSqft = ratePerSqft;

    // 1. Try to find and update the standalone unit document
    let unit = await Unit.findOneAndUpdate(
      { 
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : new mongoose.Types.ObjectId() }, 
          { originalId: id }
        ], 
        ...ownershipQuery
      },
      { 
        $set: setObj 
      },
      { new: true }
    );

    // 2. If not found as a standalone document, try to find it inside the Property details (Draft/Pending case)
    if (!unit && propertyId) {
      const property = await Property.findOne({ 
        _id: mongoose.isValidObjectId(propertyId) ? propertyId : null,
        ...ownershipQuery
      });

      if (property && property.details?.generatedUnits) {
        const units = property.details.generatedUnits;
        console.log(`[API] Searching embedded units in property ${propertyId}. Count: ${units.length}`);
        
        const unitIndex = units.findIndex((u: any) => {
            const uTowerId = u.towerId?.toString() || u.parentId?.toString() || propertyId;
            const fallbackId = `${uTowerId}-${u.unitNumber}-${u.floorNumber}`;
            const uId = u.id || u.originalId || u._id?.toString() || fallbackId;
            return uId === id;
         });
        
        if (unitIndex !== -1) {
          console.log(`[API] Found embedded unit at index ${unitIndex}. Updating...`);
          // Update the unit in the array
          units[unitIndex] = {
            ...units[unitIndex],
            status,
            customerName,
            customerPhone,
            bookingAmount,
            bookingDate,
            updatedAt: new Date().toISOString()
          };
          if (price !== undefined) units[unitIndex].price = price;
          if (ratePerSqft !== undefined) units[unitIndex].ratePerSqft = ratePerSqft;

          // Mark details as modified for Mongoose to save correctly
          property.markModified('details');
          await property.save();
          console.log(`[API] Property saved successfully.`);
          
          unit = units[unitIndex]; // For the response
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
