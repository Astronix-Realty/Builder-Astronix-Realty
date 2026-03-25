import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

/**
 * PATCH /api/properties/[id]/draft
 * Lightweight auto-save endpoint — only updates content fields, never changes status.
 * Returns minimal response for efficiency.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();

    await dbConnect();

    // Only allow updating these safe fields — never status, type, builderId, parentId
    const allowedFields: Record<string, any> = {
      updatedBy: decoded.userId,
      autoSaveVersion: (body.autoSaveVersion ?? 0) + 1,
    };

    if (body.name !== undefined)          allowedFields.name = body.name;
    if (body.location !== undefined)      allowedFields.location = body.location;
    if (body.details !== undefined)       allowedFields.details = body.details;
    if (body.lastSavedStep !== undefined) allowedFields.lastSavedStep = body.lastSavedStep;

    const property = await Property.findOneAndUpdate(
      { 
        _id: id, 
        builderId: decoded.userId, 
        isDeleted: false,
        status: "draft" // Only auto-save drafts, never overwrite published records
      },
      { $set: allowedFields },
      { new: true, runValidators: false } // Skip validators for speed — trust the schema shape
    );

    if (!property) {
      return NextResponse.json({ error: "Draft not found or already published" }, { status: 404 });
    }

    // Return only the metadata needed by the client — not the full large details object
    return NextResponse.json({
      _id: property._id,
      autoSaveVersion: property.autoSaveVersion,
      lastSavedStep: property.lastSavedStep,
      updatedAt: property.updatedAt,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Auto-save draft error:", error);
    return NextResponse.json({ error: "Auto-save failed" }, { status: 500 });
  }
}
