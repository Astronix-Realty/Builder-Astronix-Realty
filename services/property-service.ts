import mongoose from "mongoose";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { extractCloudinaryUrls } from "@/lib/utils/extract-media";
import { deleteCloudinaryFile } from "@/lib/utils/cloudinary";
import { generateRandomSlug } from "@/lib/utils/slug";

/**
 * Securely deletes a property and all its descendants (Projects, Towers, Units).
 * Executes a MongoDB transaction to avoid partial DB failures.
 * Cross-references Cloudinary URLs to prevent deleting shared/cloned media.
 *
 * @param propertyId ID of the root property to delete.
 * @param builderId Ensures ownership constraints.
 */
export async function secureDeleteProperty(propertyId: string, builderId: string) {
  // Step 1: Deep Fetch Descendant IDs across the hierarchy
  const propertiesToDelete = await Property.find({
    $or: [{ _id: propertyId }, { parentId: propertyId }],
    builderId: builderId
  }).lean();

  if (propertiesToDelete.length === 0) {
    throw new Error("Property not found or unauthorized");
  }

  let allPropertyIds = new Set<string>([propertyId]);
  let idsToSearch = [propertyId];

  // While loop to traverse n-levels dynamically
  while (idsToSearch.length > 0) {
    const children = await Property.find({ parentId: { $in: idsToSearch } }, { _id: 1 }).lean();
    const childrenIds = children.map(c => c._id.toString());

    if (childrenIds.length === 0) break;

    childrenIds.forEach(id => allPropertyIds.add(id));
    idsToSearch = childrenIds;
  }

  const allCollectedPropertyIds = Array.from(allPropertyIds);

  // Fetch all full property documents to analyze their URLs
  const fullProperties = await Property.find({ _id: { $in: allCollectedPropertyIds } }).lean();

  // Step 2: Fetch related Units
  const unitsToDelete = await Unit.find({
    $or: [
      { projectId: { $in: allCollectedPropertyIds } },
      { towerId: { $in: allCollectedPropertyIds } }
    ]
  }).lean();

  const unitIds = unitsToDelete.map(u => u._id);

  // Step 3: Extract Media URLs from everything we are deleting
  const cloudinaryUrls = new Set<string>();
  fullProperties.forEach((prop: any) => {
    extractCloudinaryUrls(prop).forEach(u => cloudinaryUrls.add(u));
  });
  unitsToDelete.forEach((unit: any) => {
    extractCloudinaryUrls(unit).forEach(u => cloudinaryUrls.add(u));
  });

  const urlsToCheck = Array.from(cloudinaryUrls);

  // Step 4: Validate URLs to prevent shared-media deletion (Orphan Check)
  const safeToDeleteUrls: string[] = [];

  for (const url of urlsToCheck) {
    const urlRegex = new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const isSharedProperty = await Property.exists({
      _id: { $nin: allCollectedPropertyIds },
      details: { $regex: urlRegex }
    });

    if (isSharedProperty) continue;

    const isSharedUnit = await Unit.exists({
      _id: { $nin: unitIds },
      $or: [
        { floorPlanImage2D: { $regex: urlRegex } },
        { floorPlanImage3D: { $regex: urlRegex } },
        { heroImage: { $regex: urlRegex } },
        { galleryImages: { $regex: urlRegex } }
      ]
    });

    if (isSharedUnit) continue;

    safeToDeleteUrls.push(url);
  }

  // Step 5: Execute atomic Database Transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const deletedPropertiesResult = await Property.deleteMany({ _id: { $in: allCollectedPropertyIds } }).session(session);
    const deletedUnitsResult = await Unit.deleteMany({ _id: { $in: unitIds } }).session(session);

    await session.commitTransaction();

    // Step 6: Post-DB Commit Cleanup (Cloudinary)
    const cloudinaryDeletes = safeToDeleteUrls.map(url => deleteCloudinaryFile(url));
    const cloudinaryResults = await Promise.allSettled(cloudinaryDeletes);

    const failedCloudinary = cloudinaryResults.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failedCloudinary.length > 0) {
      console.warn(`[secureDeleteProperty] DB successfully deleted but ${failedCloudinary.length} Cloudinary deletes failed.`);
    }

    return {
      success: true,
      propertiesDeleted: deletedPropertiesResult.deletedCount,
      unitsDeleted: deletedUnitsResult.deletedCount,
      mediaOrphanedAndDeleted: safeToDeleteUrls.length
    };

  } catch (error) {
    await session.abortTransaction();
    console.error(`[secureDeleteProperty] Transaction aborted. Rollback applied.`, error);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Promotes a draft property and its hierarchy to 'published' status.
 * 
 * FIX (Orphan Prevention): Instead of always creating a new published document,
 * we now use findOneAndUpdate with upsert=false first, falling back to create
 * only when truly no published record exists. We also query by `publishedId`
 * back-reference to catch cases where the draft's `publishedId` field is stale
 * but a published doc still exists that was created from this draft.
 */
export async function publishProperty(draftId: string, builderId: string) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const rootDraft = await Property.findOne({ _id: draftId, builderId, status: { $in: ['draft', 'pending'] } }).session(session);
    if (!rootDraft) throw new Error("Draft/Pending property not found or unauthorized");

    // 1. Collect all draft properties in hierarchy
    let allDrafts: any[] = [rootDraft];
    let idsToSearch = [draftId];
    while (idsToSearch.length > 0) {
      const children = await Property.find({ parentId: { $in: idsToSearch }, status: { $in: ['draft', 'pending'] } }).session(session).lean();
      if (children.length === 0) break;
      allDrafts.push(...children);
      idsToSearch = children.map(c => c._id.toString());
    }

    const draftToPublishedMap = new Map<string, string>();
    const resolvedLocations = new Map<string, any>();

    // 2. Process properties (Top-down order ensures parentId mapping works)
    for (const draft of allDrafts) {
      // Inherit location from parent if missing
      let resolvedLocation = draft.location || {};
      if (draft.parentId) {
        const parentLocation = resolvedLocations.get(draft.parentId.toString());
        if (parentLocation) {
          resolvedLocation = {
            city: resolvedLocation.city || parentLocation.city,
            state: resolvedLocation.state || parentLocation.state,
            address: resolvedLocation.address || parentLocation.address,
          };
        }
      }
      resolvedLocations.set(draft._id.toString(), resolvedLocation);

      const baseData: any = {
        name: draft.name,
        type: draft.type,
        flowType: draft.flowType,
        location: resolvedLocation,
        details: draft.details,
        status: 'published',
        isActive: true,
        approvedAt: new Date(),
        builderId: draft.builderId,
        updatedBy: draft.updatedBy,
      };

      let publishedProp: any = null;

      // --- FIX 5: Find published doc by publishedId (forward link on draft) ---
      if (draft.publishedId) {
        // Try to update the existing published document referenced by this draft
        const existingPub = await Property.findOne({ _id: draft.publishedId, builderId }).session(session).lean();
        if (existingPub) {
          // Preserve the existing slug to keep URLs stable
          baseData.slug = existingPub.slug;
          publishedProp = await Property.findOneAndUpdate(
            { _id: draft.publishedId, builderId },
            { $set: baseData, $unset: { draftId: "" } },
            { session, new: true }
          );
        } else {
          // publishedId is stale — the published doc was deleted externally.
          // Clear the stale reference and fall through to create a new one below.
          console.warn(`[publishProperty] Draft ${draft._id} has stale publishedId=${draft.publishedId}. Will create fresh published doc.`);
        }
      }

      // --- Fallback: No publishedId or stale — try to find by draft back-reference ---
      if (!publishedProp) {
        // Check if any published doc already claims this draft as its source
        // (handles edge case where draft.publishedId was cleared but published doc still exists)
        const existingByDraftRef = await Property.findOne({
          draftSourceId: draft._id,
          builderId,
          status: 'published',
        }).session(session).lean();

        if (existingByDraftRef) {
          baseData.slug = existingByDraftRef.slug;
          publishedProp = await Property.findOneAndUpdate(
            { _id: existingByDraftRef._id, builderId },
            { $set: baseData, $unset: { draftId: "" } },
            { session, new: true }
          );
        }
      }

      // --- Final fallback: Create brand new published document ---
      if (!publishedProp) {
        baseData.slug = generateRandomSlug(draft.name, "active");
        const created = await Property.create([{
          ...baseData,
          createdBy: draft.createdBy,
          draftSourceId: draft._id, // Back-reference for future idempotency
        }], { session });
        publishedProp = created[0];

        // Link draft → published for future edits
        await Property.updateOne(
          { _id: draft._id },
          { $set: { publishedId: publishedProp._id } },
          { session }
        );
      }

      draftToPublishedMap.set(draft._id.toString(), publishedProp._id.toString());
      
      // Also map the frontend 'id' if it exists in details (important for units extracted from details)
      const frontendId = (draft as any).details?.id || (draft as any).details?.towerId || (draft as any).details?.projectId;
      if (frontendId && typeof frontendId === 'string') {
        draftToPublishedMap.set(frontendId, publishedProp._id.toString());
      }
    }

    // 3. Fix Parent IDs in the published records
    for (const draft of allDrafts) {
      if (draft.parentId) {
        const newParentId = draftToPublishedMap.get(draft.parentId.toString());
        if (newParentId) {
          await Property.updateOne(
            { _id: draftToPublishedMap.get(draft._id.toString()) },
            { $set: { parentId: newParentId } },
            { session }
          );
        }
      }
    }

    // 4. Promote Units
    const draftPropIds = allDrafts.map(d => d._id);
    let units = await Unit.find({
      status: { $in: ['draft', 'pending'] },
      $or: [{ towerId: { $in: draftPropIds } }, { projectId: { $in: draftPropIds } }]
    }).session(session);

    // If no units found in Unit collection, extract from details of towers
    if (units.length === 0) {
      const extractedUnits: any[] = [];
      for (const draft of allDrafts) {
        if (draft.type === 'tower' && draft.details?.generatedUnits) {
          const towerUnits = draft.details.generatedUnits.filter((u: any) => u.towerId === draft._id.toString() || u.towerId === (draft as any).id);
          towerUnits.forEach((u: any) => {
            extractedUnits.push({
              ...u,
              towerId: draft._id,
              projectId: draft.parentId,
              parentId: draft._id,
              status: 'pending'
            });
          });
        }
      }
      units = extractedUnits;
    }

    for (const unit of units) {
      const activeTowerId = draftToPublishedMap.get(unit.towerId?.toString()) || unit.towerId;
      const activeProjectId = draftToPublishedMap.get(unit.projectId?.toString()) || unit.projectId;
      const activeParentId = draftToPublishedMap.get(unit.parentId?.toString()) || unit.parentId;

      const unitData = {
        type: 'unit',
        unitNumber: unit.unitNumber,
        towerId: activeTowerId,
        projectId: activeProjectId,
        parentId: activeParentId || activeTowerId, // Ensure parentId is at least the towerId
        floorNumber: unit.floorNumber || unit.floor,
        configuration: unit.configuration || unit.type,
        area: unit.area || unit.carpetArea,
        price: unit.price,
        facing: unit.facing,
        location: resolvedLocations.get(unit.towerId?.toString()) || {},
        status: 'available', // Explicitly set to available for inventory
        builderId: unit.builderId || builderId,
        createdBy: unit.createdBy || builderId,
        updatedBy: builderId,
      };

      if (unit._id && (unit.status === 'draft' || unit.status === 'pending') && !unit.isNew) {
        if (unit.publishedId) {
          await Unit.findOneAndUpdate(
            { _id: unit.publishedId },
            { $set: unitData },
            { session }
          );
        } else {
          const newUnit = await Unit.create([{
            ...unitData,
            createdBy: unit.createdBy || builderId,
          }], { session });
          await Unit.updateOne({ _id: unit._id }, { $set: { publishedId: newUnit[0]._id } }, { session });
        }
      } else {
        await Unit.create([{
          ...unitData,
          createdBy: unit.createdBy || builderId,
        }], { session });
      }
    }

    // 5. Final Step: Delete draft docs to prevent dual-card appearance
    const draftIds = allDrafts.map(d => d._id);
    await Property.deleteMany({ _id: { $in: draftIds } }).session(session);

    await Unit.deleteMany({
      _id: { $in: units.filter((u: any) => u._id).map((u: any) => u._id) },
      status: { $in: ['draft', 'pending'] }
    }).session(session);

    await session.commitTransaction();
    return { success: true, publishedId: draftToPublishedMap.get(draftId) };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Clones a published property and its hierarchy to 'draft' status.
 *
 * FIX (Idempotency): Three-layer guard to prevent creating duplicate draft docs:
 * 1. Check rootPublished.draftId and verify the doc still exists.
 * 2. Query for any draft with publishedId === this published doc's _id (catches stale links).
 * 3. Only create a new clone if both checks come up empty.
 */
export async function clonePropertyToDraft(publishedId: string, builderId: string) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const rootPublished = await Property.findOne({ _id: publishedId, builderId, status: 'published' }).session(session);
    if (!rootPublished) throw new Error("Published property not found or unauthorized");

    // --- Guard Layer 1: Check forward link on published doc ---
    if (rootPublished.draftId) {
      const existingDraft = await Property.findOne({ _id: rootPublished.draftId, status: 'draft' }).session(session);
      if (existingDraft) {
        await session.commitTransaction();
        console.log(`[clonePropertyToDraft] Returning existing draft via draftId link: ${existingDraft._id}`);
        return { success: true, draftId: existingDraft._id };
      }
      // Stale link — clear it and continue to create a fresh clone
      console.warn(`[clonePropertyToDraft] Stale draftId=${rootPublished.draftId} on published doc ${publishedId}. Clearing and re-cloning.`);
      await Property.updateOne({ _id: publishedId }, { $unset: { draftId: "" } }, { session });
    }

    // --- Guard Layer 2: Query back-reference (publishedId field on draft docs) ---
    const existingDraftByBackRef = await Property.findOne({
      publishedId: publishedId,
      builderId,
      status: 'draft',
    }).session(session);

    if (existingDraftByBackRef) {
      // Also repair the forward link on the published doc
      await Property.updateOne(
        { _id: publishedId },
        { $set: { draftId: existingDraftByBackRef._id } },
        { session }
      );
      await session.commitTransaction();
      console.log(`[clonePropertyToDraft] Returning existing draft via back-reference query: ${existingDraftByBackRef._id}`);
      return { success: true, draftId: existingDraftByBackRef._id };
    }

    // --- No existing draft found — proceed with cloning ---

    // 1. Collect all published properties in hierarchy
    let allPublished: any[] = [rootPublished];
    let idsToSearch = [publishedId];
    while (idsToSearch.length > 0) {
      const children = await Property.find({ parentId: { $in: idsToSearch }, status: 'published' }).session(session).lean();
      if (children.length === 0) break;
      allPublished.push(...children);
      idsToSearch = children.map(c => c._id.toString());
    }

    const publishedToDraftMap = new Map<string, string>();
    const resolvedLocations = new Map<string, any>();

    // 2. Clone properties (Top-down)
    for (const prop of allPublished) {
      let resolvedLocation = prop.location || {};
      if (prop.parentId) {
        const parentLocation = resolvedLocations.get(prop.parentId.toString());
        if (parentLocation) {
          resolvedLocation = {
            city: resolvedLocation.city || parentLocation.city,
            state: resolvedLocation.state || parentLocation.state,
            address: resolvedLocation.address || parentLocation.address,
          };
        }
      }
      resolvedLocations.set(prop._id.toString(), resolvedLocation);

      const draftSlug = generateRandomSlug(prop.name, "draft");
      const draftData = {
        name: prop.name,
        type: prop.type,
        flowType: prop.flowType,
        location: resolvedLocation,
        details: prop.details,
        status: 'draft',
        builderId: prop.builderId,
        publishedId: prop._id,
        slug: draftSlug,
        createdBy: prop.builderId,
        updatedBy: prop.builderId,
      };

      let draft = await Property.create([draftData], { session });
      draft = draft[0];
      publishedToDraftMap.set(prop._id.toString(), draft._id.toString());

      // Set forward link on published doc → draft
      await Property.updateOne({ _id: prop._id }, { $set: { draftId: draft._id } }, { session });
    }

    // 3. Fix Parent IDs in the draft records
    for (const prop of allPublished) {
      if (prop.parentId) {
        const newParentId = publishedToDraftMap.get(prop.parentId.toString());
        if (newParentId) {
          await Property.updateOne(
            { _id: publishedToDraftMap.get(prop._id.toString()) },
            { $set: { parentId: newParentId } },
            { session }
          );
        }
      }
    }

    // 4. Clone Units
    const pubPropIds = allPublished.map(p => p._id);
    const units = await Unit.find({
      status: { $nin: ['draft', 'pending'] },
      $or: [{ towerId: { $in: pubPropIds } }, { projectId: { $in: pubPropIds } }]
    }).session(session);

    for (const unit of units) {
      const draftTowerId = publishedToDraftMap.get(unit.towerId?.toString());
      const draftProjectId = publishedToDraftMap.get(unit.projectId?.toString());

      const draftUnitData = {
        unitNumber: unit.unitNumber,
        towerId: draftTowerId || unit.towerId,
        projectId: draftProjectId || unit.projectId,
        floorNumber: unit.floorNumber,
        configuration: unit.configuration,
        area: unit.area,
        price: unit.price,
        status: 'draft',
        builderId: unit.builderId,
        publishedId: unit._id,
        createdBy: unit.builderId,
        updatedBy: unit.builderId,
      };

      await Unit.create([draftUnitData], { session });
    }

    await session.commitTransaction();
    const newDraftId = publishedToDraftMap.get(publishedId);
    console.log(`[clonePropertyToDraft] Created fresh draft hierarchy. Root draft: ${newDraftId}`);
    return { success: true, draftId: newDraftId };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Submits a draft property for approval.
 */
export async function submitPropertyForApproval(draftId: string, builderId: string) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const rootDraft = await Property.findOne({ _id: draftId, builderId, status: { $in: ['draft', 'pending'] } }).session(session);
    if (!rootDraft) {
        const exists = await Property.findById(draftId).session(session).lean();
        if (!exists) throw new Error("DRAFT_NOT_FOUND: The draft you are trying to publish no longer exists.");
        if ((exists as any).builderId.toString() !== builderId.toString()) throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to publish this draft.");
        if ((exists as any).status !== 'draft' && (exists as any).status !== 'pending') throw new Error(`INVALID_STATUS: This property is already ${(exists as any).status}.`);

        throw new Error("Draft not found or unauthorized");
    }

    // Get all drafts in hierarchy
    let allDrafts: any[] = [rootDraft];
    let idsToSearch = [draftId];
    while (idsToSearch.length > 0) {
      const children = await Property.find({ parentId: { $in: idsToSearch }, status: { $in: ['draft', 'pending'] } }).session(session);
      if (children.length === 0) break;
      allDrafts.push(...children);
      idsToSearch = children.map(c => c._id.toString());
    }

    const draftIds = allDrafts.map(d => d._id);

    // Update Properties to pending
    await Property.updateMany(
      { _id: { $in: draftIds } },
      {
        $set: {
          status: 'pending',
          submittedAt: new Date(),
          rejectionReason: null
        }
      },
      { session }
    );

    // Update Units to pending
    await Unit.updateMany(
      {
        status: { $in: ['draft', 'pending'] },
        $or: [{ towerId: { $in: draftIds } }, { projectId: { $in: draftIds } }]
      },
      {
        $set: {
          status: 'pending',
          submittedAt: new Date(),
          rejectionReason: null
        }
      },
      { session }
    );

    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
