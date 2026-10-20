import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/panel/ads/eligible-properties
 * Returns logged-in Builder/Mandate's properties along with complete hierarchy
 * (Township/Project -> Phases -> Towers -> Units) with publication status and deep links.
 */
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader", "admin"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    // RULE 1: Profile Isolation - Strictly owned/mandated properties
    const ownershipFilter = getOwnershipQuery(context!);
    const rootQuery: Record<string, any> = {
      ...ownershipFilter,
      parentId: null,
      isDeleted: { $ne: true },
    };

    const rootProperties = await Property.find(rootQuery)
      .select("_id name townshipName slug type flowType status location details builderId accountId createdAt updatedAt")
      .populate("builderId", "name email profile")
      .populate("accountId", "name email profile")
      .sort({ updatedAt: -1 })
      .lean();

    const rootIds = rootProperties.map((p: any) => p._id);

    // Fetch child phases/projects for townships (separate collections)
    const childProjects = await Property.find({
      parentId: { $in: rootIds },
      isDeleted: { $ne: true },
    })
      .select("_id name townshipName slug type status parentId details")
      .lean();

    const childProjectIds = childProjects.map((p: any) => p._id);

    // Fetch child towers (separate collections) - only tower/building types to avoid mixing projects
    const childTowers = await Property.find({
      $or: [
        { parentId: { $in: childProjectIds } },
        { parentId: { $in: rootIds }, type: { $in: ["tower", "building"] } },
      ],
      isDeleted: { $ne: true },
    })
      .select("_id name slug type status parentId details")
      .lean();

    const childTowerIds = childTowers.map((t: any) => t._id);
    const combinedEntityIds = [...rootIds, ...childProjectIds, ...childTowerIds];

    // Fetch child units from Unit collection (if separate)
    const dbUnits = await Unit.find({
      $or: [
        { parentId: { $in: combinedEntityIds } },
        { towerId: { $in: combinedEntityIds.map((id: any) => id.toString()) } },
      ],
      isDeleted: { $ne: true },
    })
      .select("_id unitNumber configuration carpetArea price status towerId parentId")
      .lean();

    // Map units to towers (from dbUnits AND embedded in childProjects)
    const unitsByTower: Record<string, any[]> = {};
    const unitsByProject: Record<string, any[]> = {};
    const allCollectedUnitsByRoot: Record<string, any[]> = {};

    const registerUnit = (u: any, rootIdStr: string, defaultStatus: boolean) => {
      const uPrice = Number(u.price || u.allInclusivePrice || 0);
      const uArea = Number(u.carpetArea || u.area || 0);
      const uUnitNumber = u.unitNumber || "Unit";
      const uConfig = u.configuration || "Standard";
      const uStatus = u.status || "available";
      const uIsPub = defaultStatus || ["published", "active", "available"].includes(uStatus.toLowerCase());

      const unitFormatted = {
        id: (u.id || u._id || `${rootIdStr}-u-${uUnitNumber}`).toString(),
        unitNumber: uUnitNumber,
        configuration: uConfig,
        carpetArea: uArea,
        price: uPrice,
        status: uStatus,
        isPublished: uIsPub,
        towerId: (u.towerId || u.parentId || "").toString(),
        projectId: (u.projectId || u.parentProjectId || "").toString(),
      };

      if (!allCollectedUnitsByRoot[rootIdStr]) allCollectedUnitsByRoot[rootIdStr] = [];
      allCollectedUnitsByRoot[rootIdStr].push(unitFormatted);

      // Index by towerId / parentId
      const tKey = (u.towerId || u.parentId)?.toString();
      if (tKey) {
        if (!unitsByTower[tKey]) unitsByTower[tKey] = [];
        unitsByTower[tKey].push(unitFormatted);
      }

      // Index by tower name prefix (e.g. "AYODHYA-101" -> "AYODHYA")
      if (uUnitNumber && uUnitNumber.includes("-")) {
        const prefix = uUnitNumber.split("-")[0].trim().toUpperCase();
        if (prefix) {
          if (!unitsByTower[prefix]) unitsByTower[prefix] = [];
          unitsByTower[prefix].push(unitFormatted);
        }
      }

      // Index by projectId
      const pKey = (u.projectId || u.parentProjectId)?.toString();
      if (pKey) {
        if (!unitsByProject[pKey]) unitsByProject[pKey] = [];
        unitsByProject[pKey].push(unitFormatted);
      }
    };

    // 1. Register dbUnits
    dbUnits.forEach((u: any) => {
      const parentIdStr = (u.parentId || u.towerId || "").toString();
      registerUnit(u, parentIdStr, true);
    });

    // 2. Register childProjects embedded units
    childProjects.forEach((cp: any) => {
      const rootParentId = cp.parentId?.toString() || "";
      const cpId = cp._id.toString();
      const cpUnits = Array.isArray(cp.details?.generatedUnits)
        ? cp.details.generatedUnits
        : Array.isArray(cp.details?.units)
        ? cp.details.units
        : [];

      cpUnits.forEach((u: any) => {
        registerUnit(
          {
            ...u,
            projectId: u.projectId || cpId,
            parentProjectId: cpId,
          },
          rootParentId || cpId,
          ["published", "active"].includes(cp.status?.toLowerCase())
        );
      });
    });

    // Map towers to projects/roots
    const towersByParent: Record<string, any[]> = {};
    childTowers.forEach((t: any) => {
      const parentKey = t.parentId?.toString();
      const towerId = t._id.toString();
      const tNameUpper = (t.name || "").trim().toUpperCase();
      const towerUnits = unitsByTower[towerId] || unitsByTower[tNameUpper] || [];
      const isPublished = ["published", "active"].includes(t.status?.toLowerCase());

      const towerObj = {
        id: towerId,
        name: t.name || t.details?.name || "Tower",
        slug: t.slug,
        status: t.status,
        isPublished,
        reraNumber: t.details?.reraNumber || t.details?.reraId || "",
        media: t.details?.media || t.details?.heroImages || t.details?.photos || [],
        units: towerUnits,
        priceStarting: Number(t.details?.pricing?.startingPrice || t.details?.priceRangeMin || 0),
      };

      if (!towersByParent[parentKey]) towersByParent[parentKey] = [];
      towersByParent[parentKey].push(towerObj);
    });

    // Map child projects to townships
    const projectsByTownship: Record<string, any[]> = {};
    childProjects.forEach((p: any) => {
      const townshipKey = p.parentId?.toString();
      const projectId = p._id.toString();
      const projectTowers = towersByParent[projectId] || [];
      const isPublished = ["published", "active"].includes(p.status?.toLowerCase());

      const projectObj = {
        id: projectId,
        name: p.name || p.townshipName || p.details?.name || "Phase",
        slug: p.slug,
        status: p.status,
        isPublished,
        reraNumber: p.details?.reraNumber || p.details?.reraId || "",
        media: p.details?.media || p.details?.heroImages || [],
        towers: projectTowers,
        rawDetails: p.details,
      };

      if (!projectsByTownship[townshipKey]) projectsByTownship[townshipKey] = [];
      projectsByTownship[townshipKey].push(projectObj);
    });

    // Assemble complete hierarchy for root properties (including embedded details)
    const enrichedProperties = rootProperties.map((root: any) => {
      const rootId = root._id.toString();
      const isPublished = ["published", "active"].includes(root.status?.toLowerCase());
      const details = root.details || {};

      // Register root embedded units
      const allEmbeddedUnits = Array.isArray(details.generatedUnits)
        ? details.generatedUnits
        : Array.isArray(details.units)
        ? details.units
        : [];

      allEmbeddedUnits.forEach((u: any) => {
        registerUnit(u, rootId, isPublished);
      });

      const allEmbeddedTowers = Array.isArray(details.towers) ? details.towers : [];

      // Formatter for towers
      const formatTowerObj = (t: any, idx: number, fallbackRera?: string, fallbackProjId?: string) => {
        const tId = (t.id || t._id?.toString() || `${rootId}-t-${idx}`).toString();
        const tName = t.name || `Tower ${idx + 1}`;
        const tNameUpper = tName.trim().toUpperCase();

        const tUnits = unitsByTower[tId] || unitsByTower[tNameUpper] || (Array.isArray(t.units) ? t.units : []);
        const tHero = t.heroImage || "";
        const tGallery = Array.isArray(t.galleryImages)
          ? t.galleryImages.map((img: string) => ({ url: img, type: "IMAGE" }))
          : [];

        const tMedia: Array<{ url: string; type: "IMAGE" | "VIDEO" }> = [];
        if (tHero) tMedia.push({ url: tHero, type: "IMAGE" });
        tMedia.push(...tGallery);

        const uPrices = tUnits.map((u: any) => Number(u.price || 0)).filter((pr: number) => pr > 0);
        const tMinPrice = uPrices.length > 0 ? Math.min(...uPrices) : Number(t.priceRangeMin || 0);

        return {
          id: tId,
          name: tName,
          slug: t.slug || tName.toLowerCase().replace(/\s+/g, "-"),
          projectId: (t.projectId || t.parentProjectId || fallbackProjId || "").toString(),
          status: t.status || (isPublished ? "published" : "draft"),
          isPublished: isPublished || ["published", "active"].includes(t.status?.toLowerCase()),
          reraNumber: t.reraNumber || fallbackRera || "",
          media: tMedia,
          units: tUnits,
          priceStarting: tMinPrice,
        };
      };

      // 1. Collect phases / projects
      const townshipChildProjects = projectsByTownship[rootId] || [];
      const embeddedProjects = Array.isArray(details.projects) ? details.projects : [];

      let phases: any[] = [];

      if (embeddedProjects.length > 0) {
        phases = embeddedProjects.map((proj: any, idx: number) => {
          const projId = (proj.id || proj._id?.toString() || `${rootId}-proj-${idx}`).toString();
          const projName = proj.name || `Phase ${idx + 1}`;
          const projNameUpper = projName.trim().toUpperCase();

          // Child doc match if any
          const matchingChildDoc = townshipChildProjects.find(
            (cp: any) => cp.name?.trim().toUpperCase() === projNameUpper || cp.id === projId
          );

          // Find towers for this project:
          // A. Embedded towers with matching projectId / parentProjectId
          // B. Child doc towers
          // C. Towers under proj.towers
          const towersFromAll = allEmbeddedTowers.filter((t: any) => {
            const pId = (t.projectId || t.parentProjectId || "").toString();
            return pId === projId || pId === proj.id || pId === projName || pId.toUpperCase() === projNameUpper;
          });

          const towersFromChildDoc = matchingChildDoc?.towers || [];
          const towersFromProjObj = Array.isArray(proj.towers) ? proj.towers : [];

          const mergedTowerList = [...towersFromAll, ...towersFromChildDoc, ...towersFromProjObj];
          const seenTIds = new Set<string>();
          const uniqueTowers = mergedTowerList.filter((t: any) => {
            const key = (t.id || t._id || t.name || "").toString();
            if (!key || seenTIds.has(key)) return false;
            seenTIds.add(key);
            return true;
          });

          const formattedTowers = uniqueTowers.map((t: any, tIdx: number) =>
            formatTowerObj(t, tIdx, proj.reraNumber || matchingChildDoc?.reraNumber, projId)
          );

          const projHero = proj.heroImage || matchingChildDoc?.media?.[0]?.url || "";
          const projMedia: Array<{ url: string; type: "IMAGE" | "VIDEO" }> = [];
          if (projHero) projMedia.push({ url: projHero, type: "IMAGE" });

          return {
            id: projId,
            name: projName,
            slug: proj.slug || projName.toLowerCase().replace(/\s+/g, "-"),
            status: proj.status || matchingChildDoc?.status || (isPublished ? "published" : "draft"),
            isPublished: isPublished || ["published", "active"].includes(proj.status?.toLowerCase()),
            reraNumber: proj.reraNumber || matchingChildDoc?.reraNumber || "",
            media: projMedia,
            towers: formattedTowers,
          };
        });
      } else if (townshipChildProjects.length > 0) {
        phases = townshipChildProjects.map((cp: any, idx: number) => {
          const formattedTowers = (cp.towers || []).map((t: any, tIdx: number) =>
            formatTowerObj(t, tIdx, cp.reraNumber, cp.id)
          );
          return {
            id: cp.id,
            name: cp.name,
            slug: cp.slug || cp.name.toLowerCase().replace(/\s+/g, "-"),
            status: cp.status,
            isPublished: cp.isPublished,
            reraNumber: cp.reraNumber,
            media: cp.media || [],
            towers: formattedTowers,
          };
        });
      }

      // 2. All Direct/Flat Towers for root
      let directTowers = towersByParent[rootId] || [];
      if (directTowers.length === 0 && allEmbeddedTowers.length > 0) {
        directTowers = allEmbeddedTowers.map((t: any, idx: number) => formatTowerObj(t, idx, details.reraNumber));
      }

      // Also ensure towers from phases are included if directTowers is empty
      if (directTowers.length === 0 && phases.length > 0) {
        directTowers = phases.flatMap((ph: any) => ph.towers || []);
      }

      // 3. Direct units
      let directUnits = allCollectedUnitsByRoot[rootId] || [];

      // Extract pricing & calculate real starting price from units or details
      const allUnitPrices = directUnits
        .map((u: any) => Number(u.price || 0))
        .filter((pr: number) => pr > 0);
      const minUnitPrice = allUnitPrices.length > 0 ? Math.min(...allUnitPrices) : 0;

      const towerStartingPrices = directTowers
        .map((t: any) => Number(t.priceStarting || 0))
        .filter((pr: number) => pr > 0);
      const minTowerPrice = towerStartingPrices.length > 0 ? Math.min(...towerStartingPrices) : 0;

      const priceStarting =
        minUnitPrice ||
        minTowerPrice ||
        Number(details.pricing?.startingPrice) ||
        Number(details.priceStarting) ||
        Number(details.minPrice) ||
        Number(details.price) ||
        0;

      let reraNumber =
        root.reraNumber ||
        details.reraNumber ||
        details.reraId ||
        details.township?.reraNumber ||
        details.compliance?.reraNumber ||
        "";

      // If root RERA is missing or placeholder, resolve from child projects or towers
      if (!reraNumber || reraNumber.includes("XXXX")) {
        const childRera =
          phases.find((ph: any) => ph.reraNumber && !ph.reraNumber.includes("XXXX"))?.reraNumber ||
          directTowers.find((t: any) => t.reraNumber && !t.reraNumber.includes("XXXX"))?.reraNumber ||
          "";
        if (childRera) reraNumber = childRera;
      }

      const photos = Array.isArray(details.photos) ? details.photos : [];
      const heroImages = Array.isArray(details.heroImages) ? details.heroImages : [];
      const singleHero = details.heroImage || details.township?.heroImage || root.thumbnail;
      const walkthroughVideos = Array.isArray(details.walkthroughVideos) ? details.walkthroughVideos : [];

      const media: Array<{ url: string; type: "IMAGE" | "VIDEO" }> = [];
      if (singleHero && typeof singleHero === "string") {
        media.push({ url: singleHero, type: "IMAGE" });
      }
      heroImages.forEach((img: any) => {
        if (typeof img === "string") media.push({ url: img, type: "IMAGE" });
        else if (img?.url) media.push({ url: img.url, type: "IMAGE" });
      });
      photos.forEach((img: any) => {
        if (typeof img === "string") media.push({ url: img, type: "IMAGE" });
        else if (img?.url) media.push({ url: img.url, type: "IMAGE" });
      });
      walkthroughVideos.forEach((vid: any) => {
        if (typeof vid === "string") media.push({ url: vid, type: "VIDEO" });
        else if (vid?.url) media.push({ url: vid.url, type: "VIDEO" });
      });

      // De-duplicate media by URL
      const seenUrls = new Set<string>();
      const uniqueMedia = media.filter((m) => {
        if (!m.url || seenUrls.has(m.url)) return false;
        seenUrls.add(m.url);
        return true;
      });

      const locationCity = root.location?.city || details.location?.city || details.township?.city || "Mumbai";
      const locationAddress = root.location?.address || details.location?.address || details.township?.address || "";

      const resolvedName = (root.name || root.townshipName || details.township?.name || details.name || "Untitled Property").trim();
      const resolvedSlug = root.slug || resolvedName.toLowerCase().replace(/\s+/g, "-");
      const resolvedType = root.type || root.flowType || "township";

      const visitorBaseUrl = (
        process.env.VISITOR_PANEL_URL ||
        process.env.NEXT_PUBLIC_VISITOR_PANEL_URL ||
        (process.env.NODE_ENV === "production" ? "https://astronixrealty.com" : "http://localhost:3002")
      ).replace(/\/$/, "");

      const deepLinkUrl = resolvedType === "township"
        ? `${visitorBaseUrl}/township/${resolvedSlug}`
        : `${visitorBaseUrl}/properties/${resolvedSlug}`;

      const builderUser = root.builderId && typeof root.builderId === "object" ? root.builderId : null;
      const accountUser = root.accountId && typeof root.accountId === "object" ? root.accountId : null;
      const userProfile = builderUser?.profile || accountUser?.profile || {};
      const isMandateEntity = root.role === "mandate" || context?.role === "mandate";

      // ── DEVELOPER / BUILDER RESOLUTION (Mandate properties store developer inside details) ──
      const propertyInternalDevName = (
        details.builderName ||
        details.township?.builderName ||
        details.project?.builderName ||
        details.townshipData?.builderName ||
        details.developerName ||
        details.township?.developerName ||
        details.project?.developerName ||
        details.brandName ||
        details.township?.brandName ||
        details.companyName ||
        details.township?.companyName ||
        details.promoterName ||
        root.builderName ||
        root.developerName ||
        ""
      ).trim();

      const developerName = (
        propertyInternalDevName ||
        // Only fall back to account user profile if this is a direct builder account, NOT a mandate agency
        (!isMandateEntity ? (userProfile.companyName || userProfile.developerName || builderUser?.name || accountUser?.name) : "") ||
        resolvedName
      ).trim();

      const propertyInternalDevLogo =
        details.builderLogo ||
        details.township?.builderLogo ||
        details.project?.builderLogo ||
        details.townshipData?.builderLogo ||
        details.developerLogo ||
        details.township?.developerLogo ||
        details.project?.developerLogo ||
        details.brandLogo ||
        details.township?.brandLogo ||
        details.companyLogo ||
        details.township?.companyLogo ||
        root.builderLogo ||
        root.developerLogo ||
        "";

      const developerLogo =
        propertyInternalDevLogo ||
        (!isMandateEntity ? (userProfile.logo || userProfile.developerLogo || userProfile.companyLogo) : "") ||
        "";

      return {
        id: rootId,
        name: resolvedName,
        slug: resolvedSlug,
        type: resolvedType,
        developer: {
          name: developerName,
          logo: developerLogo,
        },
        status: root.status,
        isPublished,
        isEligibleForAds: isPublished,
        ineligibleReason: isPublished
          ? null
          : "⚠️ Yeh property abhi Published nahi hai. Ad chalane ke liye pehle is property ko publish karwayein.",
        reraNumber,
        priceStarting,
        location: {
          city: locationCity,
          address: locationAddress,
        },
        media: uniqueMedia,
        phases,
        towers: directTowers,
        units: directUnits,
        deepLinkUrl,
      };
    });

    return NextResponse.json({
      success: true,
      properties: enrichedProperties,
    });
  } catch (error: any) {
    console.error("[GET /api/panel/ads/eligible-properties] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
