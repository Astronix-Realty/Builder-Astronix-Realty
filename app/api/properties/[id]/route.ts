import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { secureDeleteProperty } from "@/services/property-service";

// GET /api/properties/[id] - Fetch a single property
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    // Guard: invalid ObjectId format → skip DB call and return a clean 404
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await dbConnect();

    // Only allow fetching properties owned by the token holder and not deleted
    const property = await Property.findOne({
      _id: id,
      ...getOwnershipQuery(context!),
      isDeleted: false
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    let finalProperty = property.toObject();

    // Reconstruct the split documents back into standard WizardState for editing
    // We do this if NOT draft, OR if it's a draft that was cloned (has publishedId) but has empty details.
    const isRecNeeded = (["published", "archived", "active", "pending", "rejected"].includes(finalProperty.status)) || (finalProperty.publishedId && (!finalProperty.details?.projects || finalProperty.details.projects.length === 0));

    if (isRecNeeded) {
      let wizardState: any = {
        township: {},
        projects: [],
        towers: [],
        towerUnitConfigs: [],
        generatedUnits: []
      };

      let towerDbIds: string[] = []; // Real MongoDB _ids for Unit querying
      let projectDbIds: string[] = []; // Real MongoDB _ids for project querying
      const rootId = id;

      // ── UPWARD RECONSTRUCTION (Inherit from parents if this is a child) ─────────────────
      let walk = finalProperty;
      while (walk.parentId) {
        const parent = await Property.findById(walk.parentId).lean();
        if (!parent || parent.isDeleted) break;

        if (parent.type === 'township') {
          wizardState.township = (parent as any).details?.township || (parent as any).details || {};
        } else if (parent.type === 'project') {
          const pData = extractProjectData((parent as any).details, parent._id.toString(), (parent as any).name);
          wizardState.projects = [{ ...pData, _dbId: parent._id.toString(), id: parent._id.toString() }];
        }
        walk = parent as any;
      }

      // ── EXTRACTOR HELPERS ───────────────────────────────────────────────────────────
      const extractProjectData = (details: any, dbId: string, nameFallback: string) => {
        if (!details) return {};
        if (details.projects && Array.isArray(details.projects)) {
          const match = details.projects.find((p: any) => p._dbId === dbId || p.id === dbId || p.name === nameFallback);
          return match || details.projects[0] || {};
        }
        return details;
      };

      const extractTowerData = (details: any, dbId: string, nameFallback: string) => {
        if (!details) return {};
        if (details.towers && Array.isArray(details.towers)) {
          const match = details.towers.find((t: any) => t._dbId === dbId || t.id === dbId || t.name === nameFallback);
          return match || details.towers[0] || {};
        }
        return details;
      };

      // ── DOWNWARD RECONSTRUCTION (Fill children) ─────────────────────────────────────────
      // If we are editing a standalone project/tower, it might have common inherited data in its own details.township
      if (!finalProperty.parentId && finalProperty.details?.township) {
        wizardState.township = finalProperty.details.township;
      }

      if (finalProperty.type === 'township') {
        wizardState.township = finalProperty.details?.township || finalProperty.details || {};

        const projects = await Property.find({ parentId: rootId, isDeleted: false, type: 'project' }).lean();
        wizardState.projects = projects.map(p => {
          const pData = extractProjectData(p.details, p._id.toString(), (p as any).name);
          projectDbIds.push(p._id.toString());
          return {
            name: p.name,
            ...pData,
            _dbId: p._id.toString(),
            id: p._id.toString() // Consistency Fix: Use MongoDB _id
          };
        });

        const towers = await Property.find({ parentId: { $in: projectDbIds }, isDeleted: false, type: 'tower' }).lean();

        wizardState.towers = towers.map(t => {
          const tData = extractTowerData(t.details, t._id.toString(), (t as any).name);
          const { unitConfig, ...rest } = tData as any;
          const towerId = t._id.toString(); // Consistency Fix: Use MongoDB _id
          if (unitConfig) wizardState.towerUnitConfigs.push({ ...unitConfig, towerId });
          towerDbIds.push(t._id.toString());
          return { name: t.name, ...rest, id: towerId, _dbId: t._id.toString(), projectId: t.parentId?.toString() };
        });

      } else if (finalProperty.type === 'project') {
        const projDetails = extractProjectData(finalProperty.details, id, finalProperty.name);
        wizardState.projects = [{ ...projDetails, _dbId: id, id: id }];
        projectDbIds.push(id);

        const towers = await Property.find({ parentId: rootId, isDeleted: false, type: 'tower' }).lean();
        wizardState.towers = towers.map(t => {
          const tData = extractTowerData(t.details, t._id.toString(), (t as any).name);
          const { unitConfig, ...rest } = tData as any;
          const towerId = t._id.toString(); // Consistency Fix: Use MongoDB _id
          if (unitConfig) wizardState.towerUnitConfigs.push({ ...unitConfig, towerId });
          towerDbIds.push(t._id.toString());
          return { name: t.name, ...rest, id: towerId, _dbId: t._id.toString(), projectId: t.parentId?.toString() };
        });

      } else if (finalProperty.type === 'tower') {
        const tData = extractTowerData(finalProperty.details, id, finalProperty.name);
        const { unitConfig, ...rest } = tData as any;
        const towerId = id; // Consistency Fix: Use MongoDB _id
        wizardState.towers = [{ name: finalProperty.name, ...rest, id: towerId, _dbId: id }];
        if (unitConfig) wizardState.towerUnitConfigs.push({ ...unitConfig, towerId });
        towerDbIds.push(id);
      }

      // ── UNIT FETCHING ───────────────────────────────────────────────────────────────────
      if (towerDbIds.length > 0 || projectDbIds.length > 0) {
        const units = await Unit.find({ 
          $or: [
            { towerId: { $in: towerDbIds } },
            { projectId: { $in: projectDbIds } }
          ]
        }).lean();

        if (units.length > 0) {
          wizardState.generatedUnits = units.map(u => ({
            id: (u as any).originalId || u._id.toString(),
            _dbId: u._id.toString(),
            towerId: (u as any).towerId?.toString(),
            projectId: (u as any).projectId?.toString(),
            unitNumber: u.unitNumber,
            floorNumber: u.floorNumber,
            configuration: u.configuration,
            area: u.area,
            price: u.price || 0,
            status: u.status || 'available',
            customerName: u.customerName || '',
            customerPhone: u.customerPhone || '',
            bookingAmount: u.bookingAmount || 0,
            bookingDate: u.bookingDate || null,
          }));
        } else if (finalProperty.details?.generatedUnits) {
          wizardState.generatedUnits = finalProperty.details.generatedUnits;
        }
      } else if (finalProperty.details?.generatedUnits) {
        wizardState.generatedUnits = finalProperty.details.generatedUnits;
      }

      // ── FINAL HYDRATION & CONTEXT INHERITANCE ──────────────────────────────────────────
      // Ensure the township details are populated even if we are editing a sub-entity
      if (!wizardState.township.name && finalProperty.type === 'township') {
        wizardState.township = finalProperty.details || {};
      }

      // Ensure unit configurations are preserved if they exist in details
      if (finalProperty.details) {
        if (finalProperty.details.unitTemplate) {
          wizardState.unitTemplate = finalProperty.details.unitTemplate;
        }
        if (finalProperty.details.towerUnitConfigs && Array.isArray(finalProperty.details.towerUnitConfigs) && finalProperty.details.towerUnitConfigs.length > 0) {
          wizardState.towerUnitConfigs = finalProperty.details.towerUnitConfigs;
        }
      }

      // Final merge: ensure details contains the reconstructed WizardState
      finalProperty.details = {
        ...wizardState,
        currentStep: finalProperty.lastSavedStep || 1,
        flowType: finalProperty.flowType || finalProperty.type
      };
    }

    if (finalProperty.details) {
      console.log(`[API Debug] Sending property ${id} (isRecNeeded: ${isRecNeeded}). details.projects count:`, finalProperty.details.projects?.length);
      if (finalProperty.details.projects?.length > 0) {
        console.log(`[API Debug] Project 0 keys:`, Object.keys(finalProperty.details.projects[0]));
      }
    }

    return NextResponse.json({ property: finalProperty }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/properties/[id]] error:", error.message);
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    const body = await req.json();

    await dbConnect();

    // Protect core fields from being overridden directly
    const updateData = { ...body, updatedBy: context!.userId };
    delete updateData.builderId;
    delete updateData.accountId;
    delete updateData.role;
    delete updateData.mandateId;
    delete updateData.type;

    const property = await Property.findOneAndUpdate(
      { _id: id, ...getOwnershipQuery(context!), isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!property) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ property }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

// PATCH /api/properties/[id] - Update specific fields of a property (e.g., status)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    const body = await req.json();

    await dbConnect();

    // Only allow specific safe PATCH updates, primarily status transitions like "Move to Draft"
    const allowedFields = ["status"];
    const updateData: any = { updatedBy: context!.userId };
    
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    }

    const property = await Property.findOneAndUpdate(
      { _id: id, ...getOwnershipQuery(context!), isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!property) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ property }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to apply PATCH update" }, { status: 500 });
  }
}

// DELETE /api/properties/[id] - Delete a property
// Hard deletes properties and any associated units + orphaned Cloudinary media securely.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    // Guard: invalid ObjectId format → clean 404 instead of Mongoose CastError
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await dbConnect();

    const deleteResult = await secureDeleteProperty(id, context!.userId);

    return NextResponse.json(
      { success: true, message: "Property and associated media securely deleted", details: deleteResult },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[DELETE /api/properties/[id]] error:", error.message);

    if (error.message === "Property not found or unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}

