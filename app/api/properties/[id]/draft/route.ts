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

    await dbConnect();

    // Only allow updating these safe fields — never status, type, builderId, parentId
    const $set: Record<string, any> = {
      updatedBy: context!.userId,
    };

    if (body.name !== undefined)          $set.name = body.name;
    if (body.location !== undefined)      $set.location = body.location;
    if (body.details !== undefined)       $set.details = body.details;
    if (body.lastSavedStep !== undefined) $set.lastSavedStep = body.lastSavedStep;

    // If a property was "pending", editing it reverts it to "draft" so they must resubmit
    $set.status = "draft";
    $set.rejectionReason = null;
    $set.submittedAt = null;

    const property = await Property.findOneAndUpdate(
      { 
        _id: id, 
        ...getOwnershipQuery(context!), 
        isDeleted: false,
        status: { $in: ["draft", "pending"] } // allow editing pending properties
      },
      { 
        $set,
        $inc: { autoSaveVersion: 1 }, // Atomic increment — never miss a version bump
      },
      { new: true, runValidators: false } // Skip validators for speed — trust the schema shape
    );

    if (!property) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[PATCH /api/properties/${id}/draft] Not updated. Check: not draft status, deleted, or wrong builderId='${decoded.userId}'`);
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
    
    // Ensure the property is actually a draft before letting the service delete it
    const draftProp = await Property.findOne({ _id: id, ...getOwnershipQuery(context!) });
    if (!draftProp) {
        return NextResponse.json({ success: true, message: "Draft already removed or published" }, { status: 200 });
    }

    if (draftProp.status !== "draft") {
        return NextResponse.json({ success: true, message: "Property is already active, cleaning up draft reference" }, { status: 200 });
    }

    const deleteResult = await secureDeleteProperty(id, decoded.userId);

    return NextResponse.json(
      { success: true, message: "Draft deleted securely", details: deleteResult },
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
