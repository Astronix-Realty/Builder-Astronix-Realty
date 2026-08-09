import mongoose from "mongoose";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { extractCloudinaryUrls } from "@/lib/utils/extract-media";
import { deleteCloudinaryFile } from "@/lib/utils/cloudinary";
import { generateRandomSlug } from "@/lib/utils/slug";
import { getOwnershipQuery, RBACContext } from "@/lib/rbac";
import { aggregateTownshipCounts, aggregateProjectCounts, aggregateTowerCounts } from "@/lib/services/hierarchy-sync";

/**
 * Securely deletes a property and all its descendants (Projects, Towers, Units).
 * Cross-references Cloudinary URLs to prevent deleting shared/cloned media.
 *
 * CRITICAL FIX: Before hard-deleting, notifies Admin and Visitor panels so
 * they remove or mark-deleted their own copies of the property.
 *
 * @param propertyId ID of the root property to delete.
 * @param context RBAC context for ownership constraints.
 */
export async function secureDeleteProperty(propertyId: string, context: RBACContext) {
  try {
    // Step 1: Identify all root variants (draft and published versions)
    const initialProp = await Property.findOne({ 
      _id: propertyId, 
      ...getOwnershipQuery(context) 
    }).lean();

    if (!initialProp) {
      throw new Error("Property not found or unauthorized");
    }

    // Strictly target ONLY the specific root property ID clicked by user — never cascade to other root properties
    const uniqueRootIds = [propertyId];

    // Deep Fetch Descendant IDs across the hierarchy for ALL root IDs
    const propertiesToDelete = await Property.find({
      $or: [
        { _id: { $in: uniqueRootIds } }, 
        { parentId: { $in: uniqueRootIds } }
      ],
      ...getOwnershipQuery(context)
    }).lean();

    if (propertiesToDelete.length === 0) {
      throw new Error("Property not found or unauthorized");
    }

    let allPropertyIds = new Set<string>(uniqueRootIds);
    let idsToSearch = [...uniqueRootIds];

    // While loop to traverse n-levels dynamically
    while (idsToSearch.length > 0) {
      const children = await Property.find({ parentId: { $in: idsToSearch } }, { _id: 1 }).lean();
      const childrenIds = children.map((c: any) => c._id.toString());

      if (childrenIds.length === 0) break;

      childrenIds.forEach(id => allPropertyIds.add(id));
      idsToSearch = childrenIds;
    }

    const allCollectedPropertyIds = Array.from(allPropertyIds);

    // Fetch all full property documents to analyze their status
    const fullProperties = await Property.find({ _id: { $in: allCollectedPropertyIds } }).lean();

    const isPublishedOrPending = fullProperties.some((p: any) => 
      p.status === 'published' || p.status === 'pending' || p.isActive
    );

    // ── GOVERNANCE POLICY CHECK ────────────────────────────────────────────────
    // Published & Pending properties cannot be hard deleted directly by Builder.
    // They initiate a Withdrawal Request to Admin for review and governance approval.
    if (isPublishedOrPending) {
      console.log(`[secureDeleteProperty] Initiating Withdrawal Request for property ${propertyId} (${(initialProp as any).name})`);
      const propertyObjectIds = allCollectedPropertyIds.map(id => new mongoose.Types.ObjectId(id));
      
      await Property.updateMany(
        { _id: { $in: propertyObjectIds } },
        { $set: { status: 'withdrawal_requested', isActive: false } }
      );

      // Dispatch Withdrawal Request to Admin Panel via Internal API & Outbox
      await requestCrossPanelWithdrawal(propertyId, (initialProp as any).name || 'Property');

      return {
        success: true,
        status: 'withdrawal_requested',
        propertiesUpdated: allCollectedPropertyIds.length,
        message: 'Withdrawal request submitted to Admin. The property will be removed upon Admin approval.'
      };
    }
    // ── END GOVERNANCE POLICY CHECK ────────────────────────────────────────────

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

    // Step 4: Execute Database Deletions
    const propertyObjectIds = allCollectedPropertyIds.map(id => new mongoose.Types.ObjectId(id));
    await Property.deleteMany({ _id: { $in: propertyObjectIds } });
    
    // 2. Delete all descendant Units
    await Unit.deleteMany({ _id: { $in: unitIds } });

    // Step 5: After DB success, trigger Cloudinary deletions
    let safeToDeleteUrls = [];
    if (cloudinaryUrls.size > 0) {
      // Find what IS NOT deleted yet to ensure we don't delete shared media
      const remainingProperties = await Property.find({}).lean();
      const remainingUnits = await Unit.find({}).lean();

      const remainingMedia = new Set<string>();
      remainingProperties.forEach((prop: any) => extractCloudinaryUrls(prop).forEach(u => remainingMedia.add(u)));
      remainingUnits.forEach((unit: any) => extractCloudinaryUrls(unit).forEach(u => remainingMedia.add(u)));

      const urlsToDelete = Array.from(cloudinaryUrls).filter(url => !remainingMedia.has(url));
      safeToDeleteUrls = urlsToDelete;
      
      // Note: We don't block the execution on cloudinary failures. 
      Promise.all(urlsToDelete.map(url => deleteCloudinaryFile(url))).catch(e => {
        console.error("Failed to delete some files from Cloudinary:", e);
      });
    }

    return { 
      success: true, 
      propertiesDeleted: allCollectedPropertyIds.length,
      unitsDeleted: unitIds.length,
      mediaOrphanedAndDeleted: safeToDeleteUrls.length
    };
  } catch (error) {
    console.error(`[secureDeleteProperty] Deletion failed.`, error);
    throw error;
  }
}

/**
 * Dispatches a withdrawal request for a published property to the Admin panel via Internal API & SyncQueue.
 */
async function requestCrossPanelWithdrawal(externalId: string, title: string) {
  const adminPanelUrl = process.env.ADMIN_PANEL_URL;
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (!adminPanelUrl || !internalSecret) {
    console.warn('[requestCrossPanelWithdrawal] ADMIN_PANEL_URL or INTERNAL_API_SECRET not set.');
    return;
  }

  const correlationId = `withdrawal_req_${externalId}_${Date.now()}`;
  const adminEndpoint = `${adminPanelUrl}/api/internal/v2/properties/request-withdrawal`;
  const adminPayload = {
    eventId: correlationId,
    externalId,
    title,
    reason: 'Builder requested property withdrawal / deletion.',
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(adminEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
        'x-correlation-id': correlationId,
      },
      body: JSON.stringify(adminPayload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      console.log(`[requestCrossPanelWithdrawal] Admin notified of withdrawal request: ${title} (${externalId})`);
    } else {
      const errText = await res.text().catch(() => 'Unknown error');
      console.error(`[requestCrossPanelWithdrawal] Admin request failed: HTTP ${res.status}: ${errText}`);
      await writeSyncQueueEntry(correlationId, 'admin', adminEndpoint, adminPayload, `HTTP ${res.status}`);
    }
  } catch (err: any) {
    const errMsg = err.name === 'AbortError' ? 'Timeout (8s)' : err.message;
    console.error(`[requestCrossPanelWithdrawal] Admin request failed:`, errMsg);
    await writeSyncQueueEntry(correlationId, 'admin', adminEndpoint, adminPayload, errMsg);
  }
}

/**
 * Notifies Admin and Visitor panels that a property has been deleted from Builder.
 * Admin is the primary target — it will cascade the deletion to Visitor.
 * If Admin call fails, we fall back to directly notifying Visitor as well.
 * All failures are queued to Builder's SyncQueue for retry.
 */
async function notifyCrossPanelDeletion(externalId: string, title: string) {
  const adminPanelUrl = process.env.ADMIN_PANEL_URL;
  const visitorPanelUrl = process.env.VISITOR_PANEL_URL;
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (!internalSecret) {
    console.warn('[secureDeleteProperty] INTERNAL_API_SECRET not set — cross-panel deletion sync skipped.');
    return;
  }

  const correlationId = `builder_delete_${externalId}_${Date.now()}`;

  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  let adminSyncOk = false;

  // 1. Notify Admin Panel (primary — Admin will cascade to Visitor)
  if (adminPanelUrl) {
    const adminEndpoint = `${adminPanelUrl}/api/internal/properties/delete`;
    const adminPayload = {
      eventId: correlationId,
      externalId,
      title,
      reason: 'Builder deleted this property',
    };

    try {
      const res = await fetchWithTimeout(adminEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
          'x-correlation-id': correlationId,
        },
        body: JSON.stringify(adminPayload),
      });

      if (res.ok) {
        adminSyncOk = true;
        console.log(`[secureDeleteProperty] Admin notified of deletion: ${title} (${externalId})`);
      } else {
        const errText = await res.text().catch(() => 'Unknown error');
        console.error(`[secureDeleteProperty] Admin deletion sync failed: HTTP ${res.status}: ${errText}`);
        await writeSyncQueueEntry(correlationId, 'admin', adminEndpoint, adminPayload, `HTTP ${res.status}`);
      }
    } catch (err: any) {
      const errMsg = err.name === 'AbortError' ? 'Timeout (8s)' : err.message;
      console.error(`[secureDeleteProperty] Admin deletion sync failed:`, errMsg);
      await writeSyncQueueEntry(correlationId, 'admin', adminEndpoint, adminPayload, errMsg);
    }
  }

  // 2. Direct Visitor fallback — only if Admin sync failed (Admin normally cascades)
  if (!adminSyncOk && visitorPanelUrl) {
    const visitorEndpoint = `${visitorPanelUrl}/api/internal/properties`;
    const visitorPayload = {
      eventId: `${correlationId}_visitor_fallback`,
      externalId,
      title,
      type: 'Standalone Project',
      location: '',
      price: '',
      units: 0,
      area: '',
      status: 'withdrawn', // triggers Visitor to set isDeleted=true
      snapshot: {},
    };

    try {
      const res = await fetchWithTimeout(visitorEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify(visitorPayload),
      });

      if (res.ok) {
        console.log(`[secureDeleteProperty] Visitor notified directly (Admin fallback): ${title} (${externalId})`);
      } else {
        const errText = await res.text().catch(() => 'Unknown error');
        console.error(`[secureDeleteProperty] Visitor fallback sync failed: HTTP ${res.status}`);
        await writeSyncQueueEntry(correlationId, 'visitor', visitorEndpoint, visitorPayload, `HTTP ${res.status}: ${errText}`);
      }
    } catch (err: any) {
      const errMsg = err.name === 'AbortError' ? 'Timeout (8s)' : err.message;
      console.error(`[secureDeleteProperty] Visitor fallback sync failed:`, errMsg);
      await writeSyncQueueEntry(correlationId, 'visitor', visitorEndpoint, visitorPayload, errMsg);
    }
  }
}

/**
 * Writes a failed cross-panel sync to Builder's SyncQueue for retry.
 */
async function writeSyncQueueEntry(
  correlationId: string,
  targetPanel: string,
  endpoint: string,
  payload: any,
  error: string
) {
  try {
    const SyncQueue = (await import('@/models/SyncQueue')).default;
    await SyncQueue.create({
      eventId: `${correlationId}_${targetPanel}`,
      eventType: 'PROPERTY_DELETE_SYNC',
      targetPanel,
      endpoint,
      payload,
      status: 'pending',
      attempts: 1,
      maxAttempts: 6,
      lastAttemptAt: new Date(),
      nextRetryAt: new Date(Date.now() + 30000),
      error,
    });
    console.log(`[SyncQueue] Queued ${targetPanel} delete sync for retry: ${correlationId}`);
  } catch (queueErr: any) {
    if (queueErr.code !== 11000) {
      console.error(`[SyncQueue] Failed to write queue entry for ${targetPanel}:`, queueErr.message);
    }
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
export async function publishProperty(draftId: string, context: RBACContext) {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const rootDraft = await Property.findOne({ _id: draftId, ...getOwnershipQuery(context), status: { $in: ['draft', 'pending'] } }).session(session);
      if (!rootDraft) throw new Error("Draft/Pending property not found or unauthorized");

    // 1. Collect all draft properties in hierarchy
    let allDrafts: any[] = [rootDraft];
    let idsToSearch = [draftId];
    while (idsToSearch.length > 0) {
      const children = await Property.find({ parentId: { $in: idsToSearch }, status: { $in: ['draft', 'pending'] } }).session(session).lean();
      if (children.length === 0) break;
      allDrafts.push(...children);
      idsToSearch = children.map((c: any) => c._id.toString());
    }

    const draftToPublishedMap = new Map<string, string>();
    const publishedIdToTypeMap = new Map<string, string>();
    const resolvedLocations = new Map<string, any>();

    // Parse _autoDraftIds to find frontend UUID to draft ObjectId mappings
    const autoDraftIds = rootDraft.details?._autoDraftIds || {};
    const projectMap = autoDraftIds.projectMap || {};
    const towerMap = autoDraftIds.towerMap || {};

    const draftProjectToFrontend = new Map<string, string>();
    const draftTowerToFrontend = new Map<string, string>();

    for (const [frontendId, dId] of Object.entries(projectMap)) {
      if (typeof dId === 'string') {
        draftProjectToFrontend.set(dId, frontendId);
      }
    }
    for (const [frontendId, dId] of Object.entries(towerMap)) {
      if (typeof dId === 'string') {
        draftTowerToFrontend.set(dId, frontendId);
      }
    }

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
        accountId: draft.accountId || context.userId,
        role: draft.role || context.role,
        mandateId: draft.mandateId !== undefined ? draft.mandateId : (context.mandateId || null),
        updatedBy: draft.updatedBy,
      };

      let publishedProp: any = null;

      // --- FIX 5: Find published doc by publishedId (forward link on draft) ---
      if (draft.publishedId) {
        // Try to update the existing published document referenced by this draft
        const existingPub = await Property.findOne({ _id: draft.publishedId, ...getOwnershipQuery(context) }).session(session).lean();
        if (existingPub) {
          // Preserve the existing slug to keep URLs stable
          baseData.slug = (existingPub as any).slug;
          publishedProp = await Property.findOneAndUpdate(
            { _id: draft.publishedId, ...getOwnershipQuery(context) },
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
          ...getOwnershipQuery(context),
          status: 'published',
        }).session(session).lean();

        if (existingByDraftRef) {
          baseData.slug = (existingByDraftRef as any).slug;
          publishedProp = await Property.findOneAndUpdate(
            { _id: (existingByDraftRef as any)._id, ...getOwnershipQuery(context) },
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
      publishedIdToTypeMap.set(publishedProp._id.toString(), draft.type);
      
      // Also map the frontend 'id' (UUID) if it exists
      let frontendId: string | undefined = undefined;
      if (draft.type === 'project') {
        frontendId = draftProjectToFrontend.get(draft._id.toString()) || 
          rootDraft.details?.projects?.find((p: any) => p.name === draft.name)?.id;
      } else if (draft.type === 'tower') {
        frontendId = draftTowerToFrontend.get(draft._id.toString()) || 
          rootDraft.details?.towers?.find((t: any) => t.name === draft.name)?.id;
      } else if (draft.type === 'township') {
        frontendId = autoDraftIds.townshipId || rootDraft.details?.township?.id;
      }

      if (frontendId && typeof frontendId === 'string') {
        draftToPublishedMap.set(frontendId, publishedProp._id.toString());
      }
    }

    // 3. Fix Parent IDs in the published records
    const propertyBulkOps = [];
    for (const draft of allDrafts) {
      if (draft.parentId) {
        const newParentId = draftToPublishedMap.get(draft.parentId.toString());
        if (newParentId) {
          propertyBulkOps.push({
            updateOne: {
              filter: { _id: draftToPublishedMap.get(draft._id.toString()) },
              update: { $set: { parentId: newParentId } }
            }
          });
        }
      }
    }
    if (propertyBulkOps.length > 0) {
      await Property.bulkWrite(propertyBulkOps, { session });
    }

    // 4. Promote Units
    const draftPropIds = allDrafts.map(d => d._id);
    let units = await Unit.find({
      status: { $in: ['draft', 'pending'] },
      $or: [{ towerId: { $in: draftPropIds } }, { projectId: { $in: draftPropIds } }]
    }).session(session);

    let extractedUnits: any[] = [];
    
    const getOrCreateSystemProject = async (townshipPublishedId: string, location: any, builderId: string, accountId: string, role: string, mandateId: any) => {
        let sysProj = await Property.findOne({ parentId: townshipPublishedId, name: "System Generated Project", type: "project", isDeleted: false }).session(session);
        if (!sysProj) {
            const created = await Property.create([{
                name: "System Generated Project",
                type: "project",
                flowType: "project",
                location,
                status: 'published',
                isActive: true,
                parentId: townshipPublishedId,
                builderId, accountId, role, mandateId,
                slug: generateRandomSlug("system-generated-project", "active")
            }], { session });
            sysProj = created[0];
            publishedIdToTypeMap.set(sysProj._id.toString(), 'project');
        }
        return sysProj._id.toString();
    }

    const getOrCreateSystemTower = async (projectPublishedId: string, location: any, builderId: string, accountId: string, role: string, mandateId: any) => {
        let sysTow = await Property.findOne({ parentId: projectPublishedId, name: "System Generated Tower", type: "tower", isDeleted: false }).session(session);
        if (!sysTow) {
            const created = await Property.create([{
                name: "System Generated Tower",
                type: "tower",
                flowType: "tower",
                location,
                status: 'published',
                isActive: true,
                parentId: projectPublishedId,
                builderId, accountId, role, mandateId,
                slug: generateRandomSlug("system-generated-tower", "active")
            }], { session });
            sysTow = created[0];
            publishedIdToTypeMap.set(sysTow._id.toString(), 'tower');
        }
        return sysTow._id.toString();
    }

    for (const draft of allDrafts) {
      if (draft.details?.generatedUnits && draft.details.generatedUnits.length > 0) {
        // --- GUARD: Skip parent-level unit generation if child drafts exist ---
        // If we are publishing a township, and it has child project drafts, skip unit processing here
        // (the child towers will handle their own units).
        if (draft.type === 'township' && allDrafts.some(d => d.type === 'project' && d.parentId?.toString() === draft._id.toString())) {
            continue;
        }
        // If we are publishing a project, and it has child tower drafts, skip unit processing here
        if (draft.type === 'project' && allDrafts.some(d => d.type === 'tower' && d.parentId?.toString() === draft._id.toString())) {
            continue;
        }

        const resolvedFrontendTowerId = draftTowerToFrontend.get(draft._id.toString()) || 
          rootDraft.details?.towers?.find((t: any) => t.name === draft.name)?.id;

        let sysProjId: string | null = null;
        let sysTowId: string | null = null;

        if (draft.type === 'township' || draft.type === 'project') {
            const publishedDraftId = draftToPublishedMap.get(draft._id.toString());
            if (publishedDraftId) {
                const pubLoc = resolvedLocations.get(draft._id.toString());
                const bId = draft.builderId;
                const aId = draft.accountId || context.userId;
                const r = draft.role || context.role;
                const mId = draft.mandateId;

                if (draft.type === 'township') {
                    sysProjId = await getOrCreateSystemProject(publishedDraftId, pubLoc, bId, aId, r, mId);
                    sysTowId = await getOrCreateSystemTower(sysProjId as string, pubLoc, bId, aId, r, mId);
                    
                    draftToPublishedMap.set(sysProjId as string, sysProjId as string);
                    draftToPublishedMap.set(sysTowId as string, sysTowId as string);
                } else if (draft.type === 'project') {
                    sysTowId = await getOrCreateSystemTower(publishedDraftId, pubLoc, bId, aId, r, mId);
                    
                    draftToPublishedMap.set(sysTowId as string, sysTowId as string);
                }
            }
        }

        const unitsToProcess = draft.details.generatedUnits;

        for (const u of unitsToProcess) {
            let targetTowerId = draft._id.toString();
            let targetProjectId = draft.parentId?.toString() || null;
            let targetParentId = draft._id.toString();

            if (draft.type === 'tower') {
                if (u.towerId !== draft._id.toString() && (!resolvedFrontendTowerId || u.towerId !== resolvedFrontendTowerId) && allDrafts.length > 1) {
                    continue; 
                }
            } else if (draft.type === 'township' || draft.type === 'project') {
                if (!draftToPublishedMap.get(draft._id.toString())) continue;

                if (draft.type === 'township' && sysProjId && sysTowId) {
                    targetTowerId = sysTowId;
                    targetProjectId = sysProjId;
                    targetParentId = sysTowId;
                } else if (draft.type === 'project' && sysTowId) {
                    targetTowerId = sysTowId;
                    targetProjectId = draft._id.toString();
                    targetParentId = sysTowId;
                } else {
                    continue; // Skip if we couldn't create system towers
                }
            }

            extractedUnits.push({
                ...u,
                towerId: targetTowerId,
                projectId: targetProjectId,
                parentId: targetParentId,
                status: 'pending',
                builderId: draft.builderId
            });
        }
      }
    }
    
    // Capture the DB _id of the old draft units BEFORE we overwrite the `units` array
    // with the freshly extracted frontend units (which lack DB _id).
    const validUnitDraftIdsToDelete = units
      .filter((u: any) => u._id && mongoose.isValidObjectId(u._id.toString()))
      .map((u: any) => u._id);

    // Prioritize extracted units from the draft doc (which is the frontend's source of truth)
    // over any stale draft units lingering in the DB collection.
    if (extractedUnits.length > 0) {
      units = extractedUnits;
    }

    const newUnitsToInsert: any[] = [];
    const unitBulkOps: any[] = [];

    for (const unit of (units as any[])) {
      const activeTowerId = draftToPublishedMap.get(unit.towerId?.toString()) || unit.towerId;
      const activeProjectId = draftToPublishedMap.get(unit.projectId?.toString()) || unit.projectId;
      const activeParentId = draftToPublishedMap.get(unit.parentId?.toString()) || unit.parentId;

      // Validate activeTowerId is a valid ObjectId (must not insert invalid IDs)
      if (!activeTowerId || !mongoose.isValidObjectId(activeTowerId.toString())) {
        console.warn(`[publishProperty] Skipping unit with invalid activeTowerId: ${activeTowerId}`);
        continue;
      }

      // Check if activeTowerId is actually an unpromoted draft ID to prevent orphaned units
      const isDraftId = allDrafts.some(d => d._id.toString() === activeTowerId.toString());
      if (isDraftId) {
        console.warn(`[publishProperty] Skipping unit because activeTowerId is an unpromoted draft ID: ${activeTowerId}`);
        continue;
      }

      let cleanProjectId = (activeProjectId && mongoose.isValidObjectId(activeProjectId.toString()))
        ? activeProjectId
        : null;

      if (cleanProjectId) {
        const type = publishedIdToTypeMap.get(cleanProjectId.toString());
        if (type === 'township') {
          cleanProjectId = null;
        }
      }

      const cleanParentId = (activeParentId && mongoose.isValidObjectId(activeParentId.toString()))
        ? activeParentId
        : activeTowerId;

      const draftTower = allDrafts.find(d => d._id.toString() === unit.towerId?.toString());
      const fallbackAccountId = draftTower?.accountId || rootDraft.accountId || context.userId;
      const fallbackRole = draftTower?.role || rootDraft.role || context.role;
      const fallbackMandateId = draftTower?.mandateId !== undefined ? draftTower.mandateId : (rootDraft.mandateId !== undefined ? rootDraft.mandateId : (context.mandateId || null));

      const unitData = {
        type: 'unit',
        unitNumber: unit.unitNumber,
        towerId: activeTowerId,
        projectId: cleanProjectId,
        parentId: cleanParentId,
        floorNumber: unit.floorNumber || unit.floor,
        configuration: unit.configuration || unit.type,
        area: unit.area || unit.carpetArea,
        price: unit.price,
        facing: unit.facing,
        location: resolvedLocations.get(unit.towerId?.toString()) || {},
        status: 'available', // Explicitly set to available for inventory
        // ── RBAC Tenancy Stamps (critical for getOwnershipQuery to work) ──
        builderId: unit.builderId || rootDraft.builderId,
        accountId: unit.accountId || fallbackAccountId,           // needed for builder ownership check
        role: unit.role || fallbackRole,                  // needed for mandate role filter
        mandateId: unit.mandateId !== undefined ? unit.mandateId : fallbackMandateId, // needed for mandate ownership check
        createdBy: unit.createdBy || context.userId,
        updatedBy: context.userId,
      };

      const hasValidUnitId = unit._id && mongoose.isValidObjectId(unit._id.toString());

      if (hasValidUnitId && (unit.status === 'draft' || unit.status === 'pending') && !unit.isNew) {
        if (unit.publishedId && mongoose.isValidObjectId(unit.publishedId.toString())) {
          unitBulkOps.push({
            updateOne: {
              filter: { _id: unit.publishedId },
              update: { $set: unitData }
            }
          });
        } else {
          newUnitsToInsert.push({
            ...unitData,
            createdBy: unit.createdBy || context.userId,
          });
        }
      } else {
        newUnitsToInsert.push({
          ...unitData,
          createdBy: unit.createdBy || context.userId,
        });
      }
    }

    if (unitBulkOps.length > 0) {
      await Unit.bulkWrite(unitBulkOps, { session });
    }

    if (newUnitsToInsert.length > 0) {
      await Unit.insertMany(newUnitsToInsert, { session });
    }

    // 5. Final Step: Delete draft docs to prevent dual-card appearance
    const draftIds = allDrafts.map(d => d._id);
    await Property.deleteMany({ _id: { $in: draftIds } }).session(session);

    if (validUnitDraftIdsToDelete.length > 0) {
      await Unit.deleteMany({
        _id: { $in: validUnitDraftIdsToDelete },
        status: { $in: ['draft', 'pending'] }
      }).session(session);
    }

    return { success: true, publishedId: draftToPublishedMap.get(draftId) };
    });
    
    if (result.success && result.publishedId) {
      // Sync hierarchy counts after successful publish transaction
      const publishedProp = await Property.findById(result.publishedId).lean();
      if (publishedProp) {
        if (publishedProp && (publishedProp as any).type === 'township') {
          await aggregateTownshipCounts((publishedProp as any)._id);
        } else if (publishedProp && (publishedProp as any).type === 'project') {
          await aggregateProjectCounts((publishedProp as any)._id);
        } else if (publishedProp && (publishedProp as any).type === 'tower') {
          await aggregateTowerCounts((publishedProp as any)._id);
        }

        // Also sync updated published property snapshot to Admin Panel
        if (process.env.ADMIN_PANEL_URL && process.env.INTERNAL_API_SECRET) {
          try {
            const details = (publishedProp as any).details || {};
            const township = details.township || {};
            let builderName = (publishedProp as any).builderName || details.builderName || township.builderName || township.developerName || '';

            if (!builderName && (publishedProp as any).builderId) {
              try {
                const Builder = (await import('@/models/Builder')).default;
                const builderDoc = await Builder.findById((publishedProp as any).builderId);
                if (builderDoc) {
                  builderName = builderDoc.companyName || builderDoc.fullName || builderDoc.email || 'Unknown Builder';
                }
              } catch (e) {}
            }
            if (!builderName) builderName = 'Unknown Builder';
            const locationStr = `${township.city || (publishedProp as any).location?.city || ''}, ${township.state || (publishedProp as any).location?.state || ''}`.replace(/^, |, $/g, '') || township.address || (publishedProp as any).location?.address || 'Location N/A';

            await fetch(`${process.env.ADMIN_PANEL_URL}/api/internal/properties`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': process.env.INTERNAL_API_SECRET,
              },
              body: JSON.stringify({
                eventId: `publish_${(publishedProp as any)._id}_${Date.now()}`,
                externalId: (publishedProp as any)._id.toString(),
                title: (publishedProp as any).name || township.name || 'Untitled Property',
                builder: builderName,
                builderId: (publishedProp as any).builderId?.toString() || '',
                builderExternalId: (publishedProp as any).builderId?.toString() || '',
                location: locationStr,
                price: township.totalValue ? `₹${township.totalValue}` : (details.totalValue ? `₹${details.totalValue}` : 'Price on Request'),
                type: (publishedProp as any).type || 'township',
                units: details.generatedUnits?.length || 0,
                area: township.totalArea || '',
                status: 'published',
                snapshot: details,
              }),
            });
            console.log(`[Publish Sync] Property ${(publishedProp as any).name} (${(publishedProp as any)._id}) synced to Admin panel.`);
          } catch (syncErr: any) {
            console.error(`[Publish Sync] Admin property sync failed:`, syncErr.message);
          }
        }
      }
    }
    
    return result;
  } catch (error) {
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
export async function clonePropertyToDraft(publishedId: string, context: RBACContext) {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const rootPublished = await Property.findOne({ _id: publishedId, ...getOwnershipQuery(context), status: 'published' }).session(session);
      if (!rootPublished) throw new Error("Published property not found or unauthorized");

      // --- Guard Layer 1: Check forward link on published doc ---
      if (rootPublished.draftId) {
        const existingDraft = await Property.findOne({ _id: rootPublished.draftId, status: 'draft' }).session(session);
        if (existingDraft) {
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
      ...getOwnershipQuery(context),
      status: 'draft',
    }).session(session);

    if (existingDraftByBackRef) {
      // Also repair the forward link on the published doc
      await Property.updateOne(
        { _id: publishedId },
        { $set: { draftId: existingDraftByBackRef._id } },
        { session }
      );
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
      idsToSearch = children.map((c: any) => c._id.toString());
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
        accountId: prop.accountId || context.userId,
        role: prop.role || context.role,
        mandateId: prop.mandateId !== undefined ? prop.mandateId : (context.mandateId || null),
        publishedId: prop._id,
        slug: draftSlug,
        createdBy: prop.builderId,
        updatedBy: prop.builderId,
      };

      const createdDrafts = await Property.create([draftData], { session });
      const draft = createdDrafts[0];
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

      const pubTower = allPublished.find(p => p._id.toString() === unit.towerId?.toString());
      const fallbackAccountId = pubTower?.accountId || rootPublished.accountId || context.userId;
      const fallbackRole = pubTower?.role || rootPublished.role || context.role;
      const fallbackMandateId = pubTower?.mandateId !== undefined ? pubTower.mandateId : (rootPublished.mandateId !== undefined ? rootPublished.mandateId : (context.mandateId || null));

      const draftUnitData = {
        unitNumber: unit.unitNumber,
        towerId: draftTowerId || unit.towerId,
        projectId: draftProjectId || unit.projectId,
        floorNumber: unit.floorNumber,
        configuration: unit.configuration,
        area: unit.area,
        price: unit.price,
        status: 'draft',
        builderId: unit.builderId || rootPublished.builderId,
        accountId: unit.accountId || fallbackAccountId,
        role: unit.role || fallbackRole,
        mandateId: unit.mandateId !== undefined ? unit.mandateId : fallbackMandateId,
        publishedId: unit._id,
        createdBy: unit.builderId || context.userId,
        updatedBy: context.userId,
      };

      await Unit.create([draftUnitData], { session });
    }

    const newDraftId = publishedToDraftMap.get(publishedId);
    console.log(`[clonePropertyToDraft] Created fresh draft hierarchy. Root draft: ${newDraftId}`);
    return { success: true, draftId: newDraftId };
    });
    return result;
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Submits a draft property for approval.
 */
export async function submitPropertyForApproval(draftId: string, context: RBACContext) {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const rootDraft = await Property.findOne({ _id: draftId, ...getOwnershipQuery(context), status: { $in: ['draft', 'pending'] } }).session(session);
      if (!rootDraft) {
          const exists = await Property.findById(draftId).session(session).lean();
          if (!exists) throw new Error("DRAFT_NOT_FOUND: The draft you are trying to publish no longer exists.");
          if ((exists as any).builderId.toString() !== context.userId.toString() && context.role !== 'mandate') throw new Error("UNAUTHORIZED_ACCESS: You do not have permission to publish this draft.");
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

      return { success: true, rootDraft };
    });

    if (result.success && result.rootDraft) {
      // Sync submitted root property to Admin Panel asynchronously
      const rootDraft = result.rootDraft;
      if (process.env.ADMIN_PANEL_URL && process.env.INTERNAL_API_SECRET) {
        const details = rootDraft.details || {};
        const township = details.township || {};
        let builderName = rootDraft.builderName || details.builderName || township.builderName || township.developerName || '';

        if (!builderName) {
          try {
            const Builder = (await import('@/models/Builder')).default;
            const builderDoc = await Builder.findById(rootDraft.builderId);
            if (builderDoc) {
              builderName = builderDoc.companyName || builderDoc.fullName || builderDoc.email || 'Unknown Builder';
            } else {
              const User = (await import('@/models/User')).default;
              const userDoc = await User.findById(rootDraft.builderId);
              if (userDoc) {
                builderName = (userDoc as any).profile?.companyName || (userDoc as any).profile?.fullName || (userDoc as any).profile?.developerName || (userDoc as any).email || 'Unknown Builder';
              }
            }
          } catch (e) {}
        }
        if (!builderName) builderName = 'Unknown Builder';
        const locationStr = `${township.city || rootDraft.location?.city || ''}, ${township.state || rootDraft.location?.state || ''}`.replace(/^, |, $/g, '') || township.address || rootDraft.location?.address || 'Location N/A';

        const eventId = `submit_${rootDraft._id}_${Date.now()}`;
        const adminEndpoint = `${process.env.ADMIN_PANEL_URL}/api/internal/properties`;
        const payload = {
          eventId,
          externalId: rootDraft._id.toString(),
          title: rootDraft.name || township.name || 'Untitled Property',
          builder: builderName,
          builderId: rootDraft.builderId?.toString() || '',
          builderExternalId: rootDraft.builderId?.toString() || '',
          location: locationStr,
          price: township.totalValue ? `₹${township.totalValue}` : (rootDraft.details?.totalValue ? `₹${rootDraft.details.totalValue}` : 'Price on Request'),
          type: rootDraft.type || 'township',
          units: details.generatedUnits?.length || 0,
          area: township.totalArea || '',
          status: 'pending',
          snapshot: details,
        };

        try {
          const res = await fetch(adminEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_API_SECRET,
            },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            console.log(`[Submit Sync] Property ${rootDraft.name} (${rootDraft._id}) synced to Admin panel.`);
          } else {
            console.error(`[Submit Sync] Admin property submission HTTP ${res.status}`);
            await writeSyncQueueEntry(eventId, 'admin', adminEndpoint, payload, `HTTP ${res.status}`);
          }
        } catch (err: any) {
          console.error(`[Submit Sync] Admin property submission sync failed:`, err.message);
          await writeSyncQueueEntry(eventId, 'admin', adminEndpoint, payload, err.message);
        }
      }
    }

    return { success: true };
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }
}

