import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Offer from "@/models/Offer";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); 
    const propertyId = searchParams.get("propertyId");

    const query: Record<string, any> = {
      ...getOwnershipQuery(context!)
    };

    if (statusFilter) {
      if (statusFilter === "active") {
        query.status = "active";
        // Optionally filter by date if needed, but 'active' status is usually explicit
        // query.endDate = { $gte: new Date() }; 
      } else {
        query.status = statusFilter;
      }
    }

    if (propertyId) {
      query.propertyId = propertyId;
    }

    const offers = await Offer.find(query).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({ offers }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch offers error:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const body = await req.json();
    const {
      offerName, benefitText, benefitHighlight, description, termsAndConditions,
      offerType, visibility, priorityBadge, status, startDate, endDate, autoExpire,
      bannerImage, propertyId, propertyLevel, targetScope, townshipId, projectId, towerId, unitId
    } = body;

    if (!offerName || !benefitText || !propertyId) {
      return NextResponse.json({ error: "offerName, benefitText, and propertyId are required" }, { status: 400 });
    }

    const newOffer = await Offer.create({
      offerName,
      benefitText,
      benefitHighlight,
      description,
      termsAndConditions,
      offerType,
      visibility,
      priorityBadge,
      status: status || "draft",
      startDate: startDate || null,
      endDate: endDate || null,
      autoExpire: autoExpire || false,
      bannerImage,
      propertyId,
      propertyLevel: propertyLevel || "tower",
      targetScope: targetScope || "cascade",
      townshipId: townshipId && mongoose.Types.ObjectId.isValid(townshipId) ? townshipId : null,
      projectId: projectId && mongoose.Types.ObjectId.isValid(projectId) ? projectId : null,
      towerId: towerId && mongoose.Types.ObjectId.isValid(towerId) ? towerId : null,
      unitId: unitId && mongoose.Types.ObjectId.isValid(unitId) ? unitId : null,
      builderId: context!.userId,
      accountId: context!.userId,
      mandateId: context!.mandateId || null,
      role: context!.role,
      createdBy: context!.userId,
      updatedBy: context!.userId
    });

    return NextResponse.json({ success: true, offer: newOffer }, { status: 201 });
  } catch (error: any) {
    console.error("Create offer error:", error);
    return NextResponse.json({ error: error.message || "Failed to create offer" }, { status: 500 });
  }
}
