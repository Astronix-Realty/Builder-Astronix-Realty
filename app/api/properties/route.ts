import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";
import { slugify, generateRandomSlug } from "@/lib/utils/slug";
import { invalidateInternalPropertiesCache } from "@/app/api/internal/v2/properties/route";

export const dynamic = "force-dynamic";

// GET /api/properties - Fetch root properties for the authenticated user.
// Optional query param: ?status=draft|active|archived
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate', 'teamLeader']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); // e.g. "draft", "active"

    // Root entities: parentId is null (townships and standalone projects/towers)
    const query: Record<string, any> = {
      ...getOwnershipQuery(context!),
      parentId: null,
      isDeleted: { $ne: true },
    };

    if (statusFilter) {
      if (statusFilter === "published") {
        // Auto-heal any published properties that got set to withdrawal_requested by mistake
        await Property.updateMany(
          { ...getOwnershipQuery(context!), status: "withdrawal_requested", parentId: null },
          { $set: { status: "published", isActive: true } }
        );
        query.status = { $in: ["published", "active"] };
      } else {
        query.status = statusFilter;
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[GET /api/properties] query:", JSON.stringify(query));
    }

    const allRawProperties = await Property.find(query).select('-details.units').sort({ updatedAt: -1 }).lean();

    // Deduplicate: If a property has a pending, published, or active version, exclude any duplicate draft version of the same property
    // Also deduplicate multiple properties with the exact same name (keep the most recently updated one).
    const activeOrPendingNameSet = new Set(
      allRawProperties
        .filter((p: any) => p.status === 'published' || p.status === 'active' || p.status === 'pending')
        .map((p: any) => (p.name || p.townshipName || '').trim().toLowerCase())
        .filter(Boolean)
    );

    const seenActiveOrPendingNames = new Set<string>();
    const seenDraftNames = new Set<string>();

    const rawProperties = allRawProperties.filter((p: any) => {
      const cleanName = (p.name || p.townshipName || '').trim().toLowerCase();
      
      if (!cleanName) return true; // keep nameless properties

      if (p.status === 'published' || p.status === 'active' || p.status === 'pending') {
        if (seenActiveOrPendingNames.has(cleanName)) {
          return false; // hide older duplicates of published/pending properties
        }
        seenActiveOrPendingNames.add(cleanName);
        return true;
      }

      if (p.status === 'draft') {
        if (activeOrPendingNameSet.has(cleanName)) {
          return false; // hide draft if a published/pending version exists
        }

        if (seenDraftNames.has(cleanName)) {
          return false; // hide older duplicate drafts
        }

        seenDraftNames.add(cleanName);
        return true;
      }

      return true;
    });

    // ---------------- BULK DATA FETCH FOR N+1 OPTIMIZATION ----------------
    // Separate root properties by type
    const publishedProps = rawProperties.filter((p: any) => p.status === 'published' || p.status === 'archived');
    const rootTownships = publishedProps.filter((p: any) => p.type === 'township');
    const rootProjects = publishedProps.filter((p: any) => p.type === 'project');
    const rootTowers = publishedProps.filter((p: any) => p.type === 'tower');

    const townshipIds = rootTownships.map((p: any) => p._id);
    
    // Fetch ALL projects for root townships
    const allChildProjects = await Property.find({ parentId: { $in: townshipIds }, isDeleted: { $ne: true } }, '_id name parentId details.name details.heroImage details.heroImages').lean();
    const allChildProjectIds = allChildProjects.map((p: any) => p._id);
    
    // Combine root project IDs and child project IDs
    const combinedProjectIds = [...rootProjects.map((p: any) => p._id), ...allChildProjectIds];
    
    // Fetch ALL towers for all projects
    const allChildTowers = await Property.find({ parentId: { $in: combinedProjectIds }, isDeleted: { $ne: true } }, '_id name parentId details.name details.heroImage details.id').lean();
    const allChildTowerIds = allChildTowers.map((t: any) => t._id);
    
    // Combine root tower IDs and child tower IDs
    const combinedTowerIds = [...rootTowers.map((p: any) => p._id), ...allChildTowerIds];
    
    // Fetch ALL unit counts grouped by tower using Aggregation
    let unitCountsMap: Record<string, number> = {};
    if (combinedTowerIds.length > 0) {
      const towerIdStrings = combinedTowerIds.map((id: any) => id.toString());
      const allTowerMatches = [...combinedTowerIds, ...towerIdStrings];
      const unitCountsAgg = await Unit.aggregate([
        {
          $match: {
            $or: [
              { towerId: { $in: allTowerMatches } },
              { parentId: { $in: combinedTowerIds } }
            ]
          }
        },
        {
          $group: {
            _id: { $ifNull: ["$towerId", "$parentId"] },
            count: { $sum: 1 }
          }
        }
      ]);
      unitCountsAgg.forEach((item: any) => {
        if (item._id) {
          unitCountsMap[item._id.toString()] = item.count;
        }
      });
    }

    // Process properties to attach accurate counts and thumbnails synchronously
    const properties = rawProperties.map((p: any) => {
      // 1. Handle Active/Published properties (Split DB rows)
      if (p.status === "published" || p.status === "archived") {
        let projectsCount = 0, towersCount = 0, unitsCount = 0;
        let thumbnail = p.details?.heroImage || p.details?.township?.heroImage || p.details?.project?.heroImage || p.details?.tower?.heroImage || p.heroImage || null;

        let totalValue = Number(p.totalValue) || Number(p.details?.totalValue) || Number(p.details?.township?.totalValue) || 0;
        if (!totalValue && Array.isArray(p.details?.generatedUnits) && p.details.generatedUnits.length > 0) {
          totalValue = p.details.generatedUnits.reduce((sum: number, u: any) => {
            const uPrice = Number(u.price || u.basePrice) || 0;
            if (uPrice > 0) return sum + uPrice;
            const rate = Number(u.ratePerSqft) || 0;
            const area = Number(u.carpetArea || u.area || u.builtUpArea) || 0;
            return sum + (rate * area);
          }, 0);
        }

        if (p.type === 'township') {
          const projects = allChildProjects.filter((proj: any) => proj.parentId?.toString() === p._id.toString());
          const uniqueProjectNames = new Set(projects.map((pr: any) => (pr.name || pr.details?.name || '').trim().toLowerCase()).filter(Boolean));
          projectsCount = Array.isArray(p.details?.projects) && p.details.projects.length > 0
            ? p.details.projects.length
            : (uniqueProjectNames.size > 0 ? uniqueProjectNames.size : projects.length);

          const projectIds = projects.map((proj: any) => proj._id.toString());
          const towers = allChildTowers.filter((tow: any) => projectIds.includes(tow.parentId?.toString()));
          const uniqueTowerNames = new Set(towers.map((tw: any) => (tw.name || tw.details?.name || '').trim().toLowerCase()).filter(Boolean));
          towersCount = Array.isArray(p.details?.towers) && p.details.towers.length > 0
            ? p.details.towers.length
            : (uniqueTowerNames.size > 0 ? uniqueTowerNames.size : towers.length);

          let aggUnits = towers.reduce((sum: number, tow: any) => sum + (unitCountsMap[tow._id.toString()] || 0), 0);
          if (aggUnits === 0 && Array.isArray(p.details?.generatedUnits) && p.details.generatedUnits.length > 0) {
            aggUnits = p.details.generatedUnits.length;
          }
          if (aggUnits === 0 && Array.isArray(p.details?.towers) && p.details.towers.length > 0) {
            aggUnits = p.details.towers.reduce((sum: number, t: any) => {
              const directU = Array.isArray(t.units) ? t.units.length : 0;
              if (directU > 0) return sum + directU;
              const totU = parseInt(t.totalUnits) || 0;
              if (totU > 0) return sum + totU;
              const floors = t.totalFloorsNum || parseInt((String(t.totalFloors || '').match(/\d+/g) || []).at(-1) || '0') || 0;
              const perFloor = parseInt(t.unitsPerFloor) || 0;
              return sum + (floors * perFloor);
            }, 0);
          }
          unitsCount = aggUnits;

          // Deep thumbnail resolution for Township
          if (!thumbnail) {
            thumbnail = projects.find((proj: any) => proj.details?.heroImage)?.details?.heroImage ||
              projects.find((proj: any) => proj.details?.heroImages?.[0])?.details?.heroImages?.[0];

            if (!thumbnail) {
              thumbnail = towers.find((tow: any) => tow.details?.heroImage)?.details?.heroImage;
            }
          }

        } else if (p.type === 'project') {
          projectsCount = 1;
          const towers = allChildTowers.filter((tow: any) => tow.parentId?.toString() === p._id.toString());
          const uniqueTowerNames = new Set(towers.map((tw: any) => (tw.name || tw.details?.name || '').trim().toLowerCase()).filter(Boolean));
          towersCount = Array.isArray(p.details?.towers) && p.details.towers.length > 0
            ? p.details.towers.length
            : (uniqueTowerNames.size > 0 ? uniqueTowerNames.size : towers.length);

          let aggUnits = towers.reduce((sum: number, tow: any) => sum + (unitCountsMap[tow._id.toString()] || 0), 0);
          if (aggUnits === 0 && Array.isArray(p.details?.generatedUnits) && p.details.generatedUnits.length > 0) {
            aggUnits = p.details.generatedUnits.length;
          }
          unitsCount = aggUnits;

          // Deep thumbnail resolution for Project
          if (!thumbnail) {
            thumbnail = towers.find((tow: any) => tow.details?.heroImage)?.details?.heroImage;
          }

        } else if (p.type === 'tower') {
          projectsCount = 0;
          towersCount = 1;
          unitsCount = unitCountsMap[p._id.toString()] || (Array.isArray(p.details?.generatedUnits) ? p.details.generatedUnits.length : 0);
        }

        return {
          ...p,
          calculatedCounts: { projectsCount, towersCount, unitsCount },
          thumbnail: thumbnail || null,
          totalValue: totalValue || 0,
          location: p.location?.city || p.location?.address || 'Location N/A',
          rejectionReason: p.rejectionReason || null,
          updatedAt: p.updatedAt
        };
      }

      // 2. Handle Draft, Pending, and Rejected properties (Fully contained WizardState snapshot)
      else {
        const details = p.details || {};
        const township = details.township || {};
        const projects = Array.isArray(details.projects) ? details.projects : [];
        const towers = Array.isArray(details.towers) ? details.towers : [];

        // Resolve thumbnail from draft snapshot
        const thumbnail = township.heroImage ||
          projects.find((pr: any) => pr?.heroImage)?.heroImage ||
          towers.find((tw: any) => tw?.heroImage)?.heroImage ||
          null;

        const projectsCount = p.type === 'township' ? Math.max(projects.length, 1) : (p.type === 'project' ? 1 : 0);
        
        const projectEmbeddedTowers = projects.reduce((acc: number, proj: any) => acc + (Array.isArray(proj?.towers) ? proj.towers.length : 0), 0);
        const towersCount = Math.max(towers.length + projectEmbeddedTowers, p.type === 'tower' ? 1 : 0);

        const allTowersList = [...towers];
        projects.forEach((proj: any) => {
          if (Array.isArray(proj?.towers)) {
            proj.towers.forEach((tow: any) => {
              if (!allTowersList.some((t: any) => t.id === tow.id || t.name === tow.name)) {
                allTowersList.push(tow);
              }
            });
          }
        });

        let calculatedTowerUnits = 0;
        if (allTowersList.length > 0) {
          calculatedTowerUnits = allTowersList.reduce((sum: number, t: any) => {
            if (Array.isArray(t.units) && t.units.length > 0) return sum + t.units.length;
            if (typeof t.totalUnits === 'number' && t.totalUnits > 0) return sum + t.totalUnits;
            if (typeof t.totalUnits === 'string' && parseInt(t.totalUnits) > 0) return sum + parseInt(t.totalUnits);
            const floors = t.totalFloorsNum || parseInt((String(t.totalFloors || '').match(/\d+/g) || []).at(-1) || '0') || 0;
            const perFloor = parseInt(t.unitsPerFloor) || 0;
            return sum + (floors * perFloor);
          }, 0);
        }

        const snapshotUnits = Array.isArray(details.generatedUnits) ? details.generatedUnits : [];
        const unitsCount = Math.max(
          snapshotUnits.length,
          calculatedTowerUnits,
          Number(p.units) || Number(p.totalUnits) || Number(township.totalUnits) || Number(details.totalUnits) || 0
        );

        return {
          ...p,
          thumbnail,
          calculatedCounts: { projectsCount, towersCount, unitsCount },
          townshipName: p.name || township.name,
          location: township.city || township.address || p.location?.city || 'Location N/A',
          totalValue: township.totalValue || 0,
          rejectionReason: p.rejectionReason || null,
          updatedAt: p.updatedAt
        };
      }
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[GET /api/properties] returned ${properties.length} docs.`);
    }

    return NextResponse.json({ properties }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch properties error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

// POST /api/properties - Create a new property sequentially
export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { type, flowType, parentId, name, slug, location, status, details } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required." }, { status: 400 });
    }

    // flowType is always sent by useAutoDraft, but derive a safe fallback
    // from `type` if it's somehow absent (legacy callers, tests, etc.).
    const resolvedFlowType: string = flowType || type;
    if (process.env.NODE_ENV !== "production" && !flowType) {
      console.warn(`[POST /api/properties] flowType missing for type='${type}' — defaulting to '${resolvedFlowType}'`);
    }

    await dbConnect();

    let newProperty = null;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        const finalSlug = generateRandomSlug(name, slug || "");

        newProperty = await Property.create({
          builderId: context!.userId,
          accountId: context!.userId,
          role: context!.role,
          mandateId: context!.mandateId || null,
          type,
          flowType: resolvedFlowType,
          parentId: parentId || null,
          name,
          slug: finalSlug,
          location: location || {},
          status: status || "draft",
          details: details || {},
          createdBy: context!.userId,
          updatedBy: context!.userId
        });
        break; // Success!
      } catch (err: any) {
        lastError = err;
        // Check for duplicate key error (usually 11000)
        if (err.code === 11000) {
          attempts++;
          console.warn(`[POST /api/properties] Slug collision on attempt ${attempts}. Retrying...`);
        } else {
          throw err; // Re-throw other errors
        }
      }
    }

    if (!newProperty) {
      throw lastError || new Error("Failed to create property after max attempts");
    }

    // Bust S2S cache so Admin panel instantly sees the new property
    invalidateInternalPropertiesCache();

    return NextResponse.json({ success: true, property: newProperty }, { status: 201 });
  } catch (error: any) {
    console.error("Create property error:", error.message);

    // Catch Mongoose Validation Errors (like parentId rules)
    if (error.name === 'ValidationError' || error.message.includes('Validation') || error.message.includes('Hierarchy')) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: error.message } }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
