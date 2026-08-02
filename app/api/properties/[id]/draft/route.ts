import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { secureDeleteProperty } from "@/services/property-service";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/properties/[id]/draft
 * Lightweight auto-save endpoint — only updates content fields, never changes status.
 * Returns minimal response for efficiency.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    const body = await req.json();

    // Check existing property status first
    const existingProp = await Property.findOne({
      _id: id,
      ...getOwnershipQuery(context!),
      isDeleted: false,
    }).select("status").lean();

    if (!existingProp) {
      return NextResponse.json({ error: "Draft not found or unauthorized" }, { status: 404 });
    }

    // If property is currently pending review, auto-save must NOT revert it to draft
    if ((existingProp as any).status === "pending" && body.status !== "draft") {
      return NextResponse.json({
        _id: id,
        message: "Property is pending approval. Auto-save skipped.",
      }, { status: 200 });
    }

    // Only allow updating content fields
    const $set: Record<string, any> = {
      updatedBy: context!.userId,
    };

    if (body.name !== undefined)          $set.name = body.name;
    if (body.location !== undefined)      $set.location = body.location;
    if (body.details !== undefined)       $set.details = body.details;
    if (body.lastSavedStep !== undefined) $set.lastSavedStep = body.lastSavedStep;
    if (body.parentId !== undefined)      $set.parentId = body.parentId;

    if (body.status === "draft" || (existingProp as any).status === "draft") {
      $set.status = "draft";
      $set.rejectionReason = null;
    }

    const property = await Property.findOneAndUpdate(
      { 
        _id: id, 
        ...getOwnershipQuery(context!), 
        isDeleted: false,
      },
      { 
        $set,
        $inc: { autoSaveVersion: 1 },
      },
      { new: true, runValidators: false }
    );

    if (!property) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[PATCH /api/properties/${id}/draft] Not updated. Check: not draft status, deleted, or wrong builderId='${context!.userId}'`);
      }
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

/**
 * DELETE /api/properties/[id]/draft
 * Hard-deletes a draft and all its child entities (project/tower docs).
 * Utilizes secure deletion to clear associated media efficiently.
 * Called by useAutoDraft.clearDraft() on discard or successful publish.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    // Guard: invalid ObjectId format → skip DB call, return clean 200 (idempotent)
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ success: true, message: "Nothing to delete" }, { status: 200 });
    }

    await dbConnect();
    
    // Ensure the property is actually a draft before deleting
    const draftProp = await Property.findOne({ _id: id, ...getOwnershipQuery(context!) });
    if (!draftProp) {
        return NextResponse.json({ success: true, message: "Draft already removed or published" }, { status: 200 });
    }

    if (draftProp.status !== "draft") {
        return NextResponse.json({ success: true, message: "Property is active, draft reference cleared" }, { status: 200 });
    }

    // Safely delete ONLY the draft property and its direct draft children
    // Never delete published properties when discarding a draft!
    await Property.deleteMany({
      $or: [{ _id: id }, { parentId: id }],
      ...getOwnershipQuery(context!),
      status: "draft"
    });

    return NextResponse.json(
      { success: true, message: "Draft deleted safely" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[DELETE /api/properties/[id]/draft] error:", error.message);
    
    // Idempotent catch
    if (error.message === "Property not found or unauthorized") {
       return NextResponse.json({ success: true, message: "Draft already removed" }, { status: 200 });
    }
    
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
