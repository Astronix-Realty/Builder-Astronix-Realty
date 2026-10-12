import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { secureDeleteProperty } from "@/services/property-service";

export const dynamic = "force-dynamic";

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
      isDeleted: { $ne: true }
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    let finalProperty = property.toObject();

    // Reconstruct the split documents back into standard WizardState for editing
    // We do this if NOT draft, OR if it's a draft that was cloned (has publishedId) but has empty details.
    const isRecNeeded = (["published", "archived", "active"].includes(finalProperty.status)) || (finalProperty.publishedId && (!finalProperty.details?.projects || finalProperty.details.projects.length === 0));

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
        const parent: any = await Property.findById(walk.parentId).lean();
        if (!parent || parent.isDeleted) break;

        if (parent.type === 'township') {
          wizardState.township = parent.details?.township || parent.details || {};
        } else if (parent.type === 'project') {
          const pData = extractProjectData(parent.details, parent._id.toString(), parent.name);
          wizardState.projects = [{ ...pData, _dbId: parent._id.toString(), id: parent._id.toString() }];
        }
        walk = parent;
      }

      // ── EXTRACTOR HELPERS ───────────────────────────────────────────────────────────
      function extractProjectData(details: any, dbId: string, nameFallback: string) {
        if (!details) return {};
        if (details.projects && Array.isArray(details.projects)) {
          const match = details.projects.find((p: any) => p._dbId === dbId || p.id === dbId || p.name === nameFallback);
          return match || details.projects[0] || {};
        }
        return details;
      }

      function extractTowerData(details: any, dbId: string, nameFallback: string) {
        if (!details) return {};
        if (details.towers && Array.isArray(details.towers)) {
          const match = details.towers.find((t: any) => t._dbId === dbId || t.id === dbId || t.name === nameFallback);
          return match || details.towers[0] || {};
        }
        return details;
      }

      // ── DOWNWARD RECONSTRUCTION (Fill children) ─────────────────────────────────────────
      // If we are editing a standalone project/tower, it might have common inherited data in its own details.township
      if (!finalProperty.parentId && finalProperty.details?.township) {
        wizardState.township = finalProperty.details.township;
      }

      if (finalProperty.type === 'township') {
        wizardState.township = finalProperty.details?.township || finalProperty.details || {};

        const projects = await Property.find({ parentId: rootId, isDeleted: { $ne: true }, type: 'project' }).lean();
        wizardState.projects = projects.map(p => {
          const pData = extractProjectData(p.details, (p as any)._id.toString(), (p as any).name);
          projectDbIds.push((p as any)._id.toString());
          return {
            name: (p as any).name,
            ...pData,
            _dbId: (p as any)._id.toString(),
            id: (p as any)._id.toString() // Consistency Fix: Use MongoDB _id
          };
        });

        const towers = await Property.find({ parentId: { $in: projectDbIds }, isDeleted: { $ne: true }, type: 'tower' }).lean();

        wizardState.towers = towers.map(t => {
          const tData = extractTowerData(t.details, (t as any)._id.toString(), (t as any).name);
          const { unitConfig, ...rest } = tData as any;
          const towerId = (t as any)._id.toString(); // Consistency Fix: Use MongoDB _id
          if (unitConfig) wizardState.towerUnitConfigs.push({ ...unitConfig, towerId });
          towerDbIds.push((t as any)._id.toString());
          return { name: (t as any).name, ...rest, id: towerId, _dbId: (t as any)._id.toString(), projectId: (t as any).parentId?.toString() };
        });

      } else if (finalProperty.type === 'project') {
        const projDetails = extractProjectData(finalProperty.details, id, finalProperty.name);
        wizardState.projects = [{ ...projDetails, _dbId: id, id: id }];
        projectDbIds.push(id);

        const towers = await Property.find({ parentId: rootId, isDeleted: { $ne: true }, type: 'tower' }).lean();
        wizardState.towers = towers.map(t => {
          const tData = extractTowerData(t.details, (t as any)._id.toString(), (t as any).name);
          const { unitConfig, ...rest } = tData as any;
          const towerId = (t as any)._id.toString(); // Consistency Fix: Use MongoDB _id
          if (unitConfig) wizardState.towerUnitConfigs.push({ ...unitConfig, towerId });
          towerDbIds.push((t as any)._id.toString());
          return { name: (t as any).name, ...rest, id: towerId, _dbId: (t as any)._id.toString(), projectId: (t as any).parentId?.toString() };
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
            id: (u as any).originalId || (u as any)._id.toString(),
            _dbId: (u as any)._id.toString(),
            towerId: (u as any).towerId?.toString(),
            projectId: (u as any).projectId?.toString(),
            unitNumber: u.unitNumber,
            floorNumber: u.floorNumber,
            configuration: u.configuration,
            area: u.area,
            price: u.price || 0,
            status: u.status || 'available',
            customerName: (u as any).customerName || '',
            customerPhone: (u as any).customerPhone || '',
            bookingAmount: (u as any).bookingAmount || 0,
            bookingDate: (u as any).bookingDate || null,
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

    const updatePayload: any = { $set: updateData };
    if (body.status === 'pending') {
      updatePayload.$inc = { editCount: 1 };
      updatePayload.$set.submittedAt = new Date();
    }

    const property = await Property.findOneAndUpdate(
      { _id: id, ...getOwnershipQuery(context!), isDeleted: { $ne: true } },
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!property) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    // If status changed to 'pending', sync property to Admin panel for approval
    if (body.status === 'pending' && process.env.ADMIN_PANEL_URL && process.env.INTERNAL_API_SECRET) {
      // Get builder name for Admin display
      let builderName = 'Unknown Builder';
      try {
        const Builder = (await import('@/models/Builder')).default;
        const builderDoc = await Builder.findById(property.builderId);
        if (builderDoc) {
          builderName = builderDoc.companyName || builderDoc.fullName || builderDoc.email || 'Unknown Builder';
        } else {
          const User = (await import('@/models/User')).default;
          const userDoc = await User.findById(property.builderId);
          if (userDoc) {
            builderName = (userDoc as any).profile?.companyName || (userDoc as any).profile?.fullName || (userDoc as any).profile?.developerName || (userDoc as any).email || 'Unknown Builder';
          }
        }
      } catch (e) {
        // Silently continue if builder lookup fails
      }

      // Fetch units to embed in the snapshot
      let syncedDetails = property.details ? { ...property.details } : {};
      try {
        const UnitModel = (await import('@/models/Unit')).default;
        const dbUnits = await UnitModel.find({
          $or: [
            { projectId: property._id },
            { projectId: property._id.toString() },
            { towerId: property._id },
            { towerId: property._id.toString() }
          ],
          isDeleted: { $ne: true }
        }).lean();
        
        if (dbUnits.length > 0) {
          syncedDetails.generatedUnits = dbUnits.map((u: any) => ({
            id: u.originalId || u._id.toString(),
            _dbId: u._id.toString(),
            towerId: u.towerId?.toString(),
            projectId: u.projectId?.toString(),
            unitNumber: u.unitNumber,
            floorNumber: u.floorNumber,
            configuration: u.configuration,
            area: u.area,
            price: u.price || 0,
            basePrice: u.basePrice || u.price || 0,
            allInclusivePrice: u.allInclusivePrice || u.price || 0,
            status: u.status || 'available',
          }));
        }
      } catch (e) {
        console.error("Failed to load units for sync:", e);
      }

      fetch(`${process.env.ADMIN_PANEL_URL}/api/internal/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET,
        },
        body: JSON.stringify({
          externalId: property._id.toString(),
          title: property.name,
          builder: builderName,
          builderId: property.builderId.toString(),
          builderExternalId: property.builderId.toString(),
          location: `${property.location?.city || ''}, ${property.location?.state || ''}`.replace(/^, |, $/g, ''),
          price: property.details?.totalValue || '',
          type: property.type,
          units: syncedDetails.generatedUnits?.length || 0,
          area: property.details?.totalArea || '',
          status: 'pending',
          snapshot: syncedDetails,
        }),
      }).catch((err: any) => console.error('[Sync] Admin property sync failed:', err.message));
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

    // Only allow specific safe PATCH updates, primarily status transitions like "Move to Draft" and quick inline updates like "groupBuying"
    const allowedFields = ["status", "groupBuying"];
    const updateData: any = { updatedBy: context!.userId };
    
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    }

    const property = await Property.findOneAndUpdate(
      { _id: id, ...getOwnershipQuery(context!), isDeleted: { $ne: true } },
      { $set: updateData },
      { new: true, runValidators: true, strict: false }
    );
    if (!property) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    if (updateData.status === 'draft' && process.env.ADMIN_PANEL_URL && process.env.INTERNAL_API_SECRET) {
      try {
        await fetch(`${process.env.ADMIN_PANEL_URL}/api/internal/properties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET,
          },
          body: JSON.stringify({
            eventId: `draft_${property._id}_${Date.now()}`,
            externalId: property._id.toString(),
            title: property.name || 'Property',
            status: 'draft',
          }),
        }).catch((err: any) => console.error('[PATCH draft sync] Admin sync failed:', err.message));
      } catch (e) {}
    }

    return NextResponse.json({ property }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to apply PATCH update" }, { status: 500 });
  }
}

// DELETE /api/properties/[id] - Hard delete property and all associated units permanently from DB
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await dbConnect();

    // Find target property and all direct children (projects/towers)
    const childProps = await Property.find({ parentId: id }, { _id: 1 }).lean();
    const childIds = childProps.map((c: any) => c._id.toString());
    const allPropIds = [id, ...childIds];

    // 1. Hard delete all units associated with this property hierarchy
    await Unit.deleteMany({
      $or: [
        { propertyId: { $in: allPropIds } },
        { towerId: { $in: allPropIds } },
        { projectId: { $in: allPropIds } }
      ]
    });

    // 2. Hard delete the property document and child property documents permanently from MongoDB
    const deleteResult = await Property.deleteMany({
      _id: { $in: allPropIds },
      ...getOwnershipQuery(context!)
    });

    return NextResponse.json(
      { success: true, message: "Property permanently deleted from DB", deletedCount: deleteResult.deletedCount },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[DELETE /api/properties/[id]] error:", error.message);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}

