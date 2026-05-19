import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Unit from "@/models/Unit";
import Property from "@/models/Property";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { aggregateTowerPricing } from "@/lib/services/pricing-sync";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: towerId } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { ratePerSqft } = body;

    if (ratePerSqft === undefined || isNaN(parseFloat(ratePerSqft)) || parseFloat(ratePerSqft) <= 0) {
      return NextResponse.json({ error: "Invalid rate provided" }, { status: 400 });
    }

    await dbConnect();

    // 1. Verify that the user has ownership/access to the parent tower property
    const tower = await Property.findOne({
      _id: towerId,
      ...getOwnershipQuery(context!),
      isDeleted: false
    });

    if (!tower) {
      return NextResponse.json({ error: "Tower not found or unauthorized" }, { status: 404 });
    }

    // 2. Fetch all units for this tower (since parent ownership is verified, all units under this tower can be updated)
    const units = await Unit.find({ towerId });
    
    if (units.length === 0) {
        return NextResponse.json({ error: "No units found for this tower" }, { status: 404 });
    }

    // 3. Perform bulk update
    const bulkOps = units.map((u: any) => ({
      updateOne: {
        filter: { _id: u._id },
        update: { 
          $set: { 
            price: Math.round((u.area || 0) * parseFloat(ratePerSqft)),
            ratePerSqft: parseFloat(ratePerSqft),
            updatedBy: context!.userId
          } 
        }
      }
    }));

    const result = await Unit.bulkWrite(bulkOps);

    // 4. Recalculate price ranges and labels for Tower, Project, and Township in real-time
    await aggregateTowerPricing(towerId);

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

