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

  // Get project IDs (direct children) to recursively find towers
  // Note: For a 3-level deep structure (Township -> Project -> Tower),
  // a Township's parentId is null, Project's parentId is Township,
  // Tower's parentId is Project.
  // The simple `parentId: propertyId` above only fetches direct children.
  // We need a loop to get all nested levels safely.

  let allPropertyIds = new Set<string>([propertyId]);
  let idsToSearch = [propertyId];

  // While loop to traverse n-levels dynamically
  while (idsToSearch.length > 0) {
    const children = await Property.find({ parentId: { $in: idsToSearch } }, { _id: 1 }).lean();
    const childrenIds = children.map(c => c._id.toString());
    
    // Break if no more children
    if (childrenIds.length === 0) break;

    // Add new children to the master collected set
    childrenIds.forEach(id => allPropertyIds.add(id));
    
    // Next iteration searches for children of these children
    idsToSearch = childrenIds;
  }

  const allCollectedPropertyIds = Array.from(allPropertyIds);

  // Fetch all full property documents to analyze their URLs
  const fullProperties = await Property.find({ _id: { $in: allCollectedPropertyIds } }).lean();

  // Step 2: Fetch related Units (Units map to projects or towers)
  // We grab units mapping to ANY of the property IDs in the cascade
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
  // Check if any of these URLs are used by properties/units OUTSIDE this deletion scope
  const safeToDeleteUrls: string[] = [];

  for (const url of urlsToCheck) {
    // Escaped string for basic regex (safe enough for standard URLs)
    const urlRegex = new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // Is it used in another Property?
    const isSharedProperty = await Property.exists({
      _id: { $nin: allCollectedPropertyIds },
      // Ideally, we search a stringified representation or specific fields.
      // Easiest is to search the entire document via a text index or regex.
      // Since `details` holds most data:
      details: { $regex: urlRegex }
    });

    if (isSharedProperty) continue; // Skip to next URL

    // Is it used in another Unit?
    const isSharedUnit = await Unit.exists({
      _id: { $nin: unitIds },
      // Units have simpler schemas, check top level keys containing URLs
      $or: [
        { floorPlanImage2D: { $regex: urlRegex } },
        { floorPlanImage3D: { $regex: urlRegex } },
        { heroImage: { $regex: urlRegex } },
        { galleryImages: { $regex: urlRegex } }
      ]
    });

    if (isSharedUnit) continue; // Skip

    safeToDeleteUrls.push(url);
  }

  // Step 5: Execute atomic Database Transaction (Rollback protected)
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // The transaction only covers Mongoose operations. 
    // If DB fails here, it aborts, and properties remain intact.
    const deletedPropertiesResult = await Property.deleteMany({ _id: { $in: allCollectedPropertyIds } }).session(session);
    const deletedUnitsResult = await Unit.deleteMany({ _id: { $in: unitIds } }).session(session);

    await session.commitTransaction();

    // Step 6: Post-DB Commit Cleanup (Cloudinary)
    // Runs sequentially or in parallel without threatening DB integrity
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
 * Promotes a draft property and its hierarchy to 'active' status.
 * Reconciles with existing published records if publishedId is present.
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

      let publishedProp: any;
      const isNew = !draft.publishedId;

      let baseDataSlug = draft.slug;
      
      const baseData: any = {
        name: draft.name,
        type: draft.type,
        flowType: draft.flowType,
        location: resolvedLocation,
        details: draft.details,
        status: 'published',
        isActive: true,
        approvedAt: new Date(),
        // Needs approvedBy to be passed later when admin router calls this
        builderId: draft.builderId,
        updatedBy: draft.updatedBy,
        slug: baseDataSlug,
      };

      if (!isNew) {
        // Find existing published to preserve its slug
        const existingPub = await Property.findOne({ _id: draft.publishedId }).session(session).lean();
        if (existingPub) baseData.slug = existingPub.slug;

        publishedProp = await Property.findOneAndUpdate(
          { _id: draft.publishedId, builderId },
          { $set: baseData, $unset: { draftId: "" } }, // Remove draft link from published since it's promoted
          { session, new: true }
        );
      } 
      
      if (isNew || !publishedProp) {
        // Generate a fresh unique slug for the newly published property to avoid colliding with the active draft
        baseData.slug = generateRandomSlug(draft.name, "active");

        // Create new active record
        publishedProp = await Property.create([{
          ...baseData,
          createdBy: draft.createdBy,
        }], { session });
        publishedProp = publishedProp[0];

        // Link draft to the new published record
        await Property.updateOne(
          { _id: draft._id },
          { $set: { publishedId: publishedProp._id } },
          { session }
        );
      }

      draftToPublishedMap.set(draft._id.toString(), publishedProp._id.toString());
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
              towerId: draft._id, // Use real ObjectId
              projectId: draft.parentId, // Use real ObjectId
              parentId: draft._id, // Tower is parent
              status: 'pending' // Mark as pending for processing below or draft
            });
          });
        }
      }
      units = extractedUnits;
    }

    for (const unit of units) {
      // Map temporary IDs to real ObjectIds if necessary
      const activeTowerId = draftToPublishedMap.get(unit.towerId?.toString()) || unit.towerId;
      const activeProjectId = draftToPublishedMap.get(unit.projectId?.toString()) || unit.projectId;
      const activeParentId = draftToPublishedMap.get(unit.parentId?.toString()) || unit.parentId;

      const unitData = {
        type: 'unit',
        unitNumber: unit.unitNumber,
        parentId: activeParentId,
        towerId: activeTowerId,
        projectId: activeProjectId,
        floorNumber: unit.floorNumber || unit.floor,
        configuration: unit.configuration,
        area: unit.area || unit.carpetArea,
        price: unit.price,
        facing: unit.facing,
        location: resolvedLocations.get(unit.towerId?.toString()) || {},
        status: 'available',
        builderId: unit.builderId || builderId,
        updatedBy: builderId,
      };

      if (unit._id && (unit.status === 'draft' || unit.status === 'pending') && !unit.isNew) {
        // Update existing draft if it exists in DB
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
        // Create new unit (from extracted data)
        await Unit.create([{
          ...unitData,
          createdBy: unit.createdBy || builderId,
        }], { session });
      }
    }

    // 5. Final Step: Clear Drafts (Optional: keep them? The user said "one draft and one published")
    // If we keep the draft, we should update its status or just leave it.
    // The user's request implies the draft remains linked to its published version.
    // But usually after publish, the draft is synonymous with the active version.
    // We'll mark them as promoted or just leave them as they are but linked.
    
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
 * If a draft already exists, returns the existing draft.
 */
export async function clonePropertyToDraft(publishedId: string, builderId: string) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const rootPublished = await Property.findOne({ _id: publishedId, builderId, status: 'published' }).session(session);
    if (!rootPublished) throw new Error("Published property not found or unauthorized");

    // If a draft already exists, just return it
    if (rootPublished.draftId) {
      const existingDraft = await Property.findOne({ _id: rootPublished.draftId, status: 'draft' }).session(session);
      if (existingDraft) {
        await session.commitTransaction();
        return { success: true, draftId: existingDraft._id };
      }
    }

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
      // Inherit location from parent if missing
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

      // Update original with draftId
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
      status: { $nin: ['draft', 'pending'] }, // include published, available, etc.
      $or: [{ towerId: { $in: pubPropIds } }, { projectId: { $in: pubPropIds } }] 
    }).session(session);

    for (const unit of units) {
      const draftTowerId = publishedToDraftMap.get(unit.towerId);
      const draftProjectId = publishedToDraftMap.get(unit.projectId);

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
    return { success: true, draftId: publishedToDraftMap.get(publishedId) };
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

    const rootDraft = await Property.findOne({ _id: draftId, builderId, status: 'draft' }).session(session);
    if (!rootDraft) {
        // Detailed check for error reporting
        const exists = await Property.findById(draftId).session(session).lean();
        if (!exists) throw new Error("DRAFT_NOT_FOUND: The draft you are trying to publish no longer exists.");
        if ((exists as any).builderId.toString() !== builderId.toString()) throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to publish this draft.");
        if ((exists as any).status !== 'draft') throw new Error(`INVALID_STATUS: This property is already ${(exists as any).status}.`);
        
        throw new Error("Draft not found or unauthorized");
    }

    // Get all drafts in hierarchy
    let allDrafts: any[] = [rootDraft];
    let idsToSearch = [draftId];
    while (idsToSearch.length > 0) {
      const children = await Property.find({ parentId: { $in: idsToSearch }, status: 'draft' }).session(session);
      if (children.length === 0) break;
      allDrafts.push(...children);
      idsToSearch = children.map(c => c._id.toString());
    }

    const draftIds = allDrafts.map(d => d._id);

    // Update Properties
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

    // Update Units
    await Unit.updateMany(
      { 
        status: 'draft', 
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
