import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import User from "@/models/User";
import { checkRBAC, getOwnershipQuery, RBACContext } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalizedUnit {
  _id: string;
  id: string;
  unitNumber: string;
  floorNumber: number;
  configuration: string;
  area: number;
  price: number;
  ratePerSqft: number;
  status: string;
  towerId: string;
  projectId: string | null;
  customerName: string;
  customerPhone: string;
  bookingAmount: number;
  bookingDate: string | null;
  facing: string;
  source: "collection" | "embedded";
}

// ─── Helper: Normalize a raw unit doc (from Unit collection) ─────────────────

function normalizeCollectionUnit(u: any, towerId: string, projectId: string | null): NormalizedUnit {
  return {
    _id: u._id.toString(),
    id: u._id.toString(),
    unitNumber: u.unitNumber || "",
    floorNumber: u.floorNumber || u.floor || 0,
    configuration: u.configuration || u.type || "",
    area: u.area || u.carpetArea || 0,
    price: u.price || 0,
    ratePerSqft: u.ratePerSqft || 0,
    status: u.status || "available",
    towerId,
    projectId,
    customerName: u.customerName || "",
    customerPhone: u.customerPhone || "",
    bookingAmount: u.bookingAmount || 0,
    bookingDate: u.bookingDate || null,
    facing: u.facing || "",
    source: "collection",
  };
}



// ─── Helper: Fetch units for a set of tower IDs ───────────────────────────────
// Multi-strategy: tries Unit collection first, then falls back to embedded units
// Handles both published units (status: available/sold/blocked/reserved) and
// old-format units that might have status: "published" or "archived"

async function fetchUnitsForTowers(
  towerDocs: any[],
  projectIdStr: string | null,
  ownershipQuery: Record<string, any>,
  rootProperty: any,
  session?: mongoose.ClientSession
): Promise<NormalizedUnit[]> {
  if (towerDocs.length === 0) return [];

  const towerMongoIds = towerDocs.map((t) => t._id);

  const INVENTORY_STATUSES = ["available", "sold", "blocked", "reserved", "booked", "published", "archived"];

  const unitQuery: any = {
    towerId: { $in: towerMongoIds },
    status: { $in: INVENTORY_STATUSES }
    // Intentionally omitting ownershipQuery here to allow all units of the visible tower to be shown
  };

  let collectionUnits = await Unit.find(unitQuery).session(session as any).lean();

  if (collectionUnits.length === 0) {
    collectionUnits = await Unit.find({
      towerId: { $in: towerMongoIds },
      status: { $nin: ["draft", "rejected"] }
    }).session(session as any).lean();
  }

  const unitsToReturn: NormalizedUnit[] = [];

  if (collectionUnits.length > 0) {
    unitsToReturn.push(...collectionUnits.map((u: any) => {
      const uTowerId = u.towerId?.toString() || "";
      const uProjectId = u.projectId?.toString() || projectIdStr;
      return normalizeCollectionUnit(u, uTowerId, uProjectId);
    }));
  } else {
    // Fallback: Extract from embedded generatedUnits
    const rootEmbeddedUnits = rootProperty?.details?.generatedUnits || [];
    if (rootEmbeddedUnits.length > 0) {
      for (const tower of towerDocs) {
        let frontendTowerId: string | null = null;

        // Attempt 1: Find frontend ID using autoDraftIds
        if (tower.details._autoDraftIds?.towerMap) {
          const towerMap = tower.details._autoDraftIds.towerMap;
          frontendTowerId = Object.keys(towerMap).find((k) => towerMap[k] === tower._id.toString()) || null;
        }

        // Attempt 2: Match by name in details.towers
        if (!frontendTowerId && Array.isArray(tower.details.towers)) {
          const matchedTower = tower.details.towers.find((t: any) => t.name === tower.name);
          if (matchedTower) {
            frontendTowerId = matchedTower.id;
          }
        }

        // Filter units to only those belonging to this tower
        const relevantUnits = rootEmbeddedUnits.filter((u: any) => {
          if (!u.towerId) return true; // Edge case: no towerId
          if (frontendTowerId && u.towerId === frontendTowerId) return true;
          if (u.towerId === tower._id.toString()) return true;
          return false;
        });

        unitsToReturn.push(...relevantUnits.map((u: any) => {
          return {
            _id: u.id || u.originalId || u._id?.toString() || `${tower._id.toString()}-${u.unitNumber}-${u.floorNumber}`,
            id: u.id || u.originalId || u._id?.toString() || `${tower._id.toString()}-${u.unitNumber}-${u.floorNumber}`,
            unitNumber: u.unitNumber || "",
            floorNumber: u.floorNumber || u.floor || 0,
            configuration: u.configuration || u.type || "",
            area: u.area || u.carpetArea || 0,
            price: u.price || 0,
            ratePerSqft: u.ratePerSqft || 0,
            status: u.status || "available",
            towerId: tower._id.toString(), // Safely set to DB ID now
            projectId: projectIdStr,
            customerName: u.customerName || "",
            customerPhone: u.customerPhone || "",
            bookingAmount: u.bookingAmount || 0,
            bookingDate: u.bookingDate || null,
            facing: u.facing || "",
            source: "embedded",
          };
        }));
      }
    }
  }

  return unitsToReturn;
}

// ─── Helper: Derive floor count from tower details ───────────────────────────
// Priority: totalFloorsNum → parse totalFloors string → max floor in floorGroups → units ÷ unitsPerFloor

function deriveFloorCount(towerObj: any, towerUnitConfigs: any[], towerId: string, towerUnitsList: any[] = []): number {
  if (!towerObj) return 0;
  const d = towerObj.details || towerObj;

  // 1. Direct numeric fields (most reliable)
  if (towerObj.totalFloorsNum && Number(towerObj.totalFloorsNum) > 0) return Number(towerObj.totalFloorsNum);
  if (d.totalFloorsNum && Number(d.totalFloorsNum) > 0) return Number(d.totalFloorsNum);
  if (typeof towerObj.totalFloors === "number" && towerObj.totalFloors > 0) return towerObj.totalFloors;
  if (typeof d.totalFloors === "number" && d.totalFloors > 0) return d.totalFloors;
  if (typeof towerObj.floors === "number" && towerObj.floors > 0) return towerObj.floors;
  if (typeof d.floors === "number" && d.floors > 0) return d.floors;
  if (typeof towerObj.floorCount === "number" && towerObj.floorCount > 0) return towerObj.floorCount;
  if (typeof d.floorCount === "number" && d.floorCount > 0) return d.floorCount;

  // 2. Parse totalFloors / floors string — handles "G + 25", "G+30", "25", "B2 + 25" etc.
  const rawFloorsStr = String(towerObj.totalFloors || d.totalFloors || towerObj.floors || d.floors || "");
  if (rawFloorsStr) {
    const numMatches = rawFloorsStr.match(/\d+/g);
    if (numMatches && numMatches.length > 0) {
      const parsed = parseInt(numMatches[numMatches.length - 1]);
      if (parsed > 0) return parsed;
    }
  }

  // 3. Derive from floorGroups (most accurate for wizard-configured towers)
  const config = (towerUnitConfigs || []).find((c: any) =>
    c.towerId === towerId ||
    c.towerId === towerObj?.id ||
    c.towerId === d?.id
  );
  const floorGroups = config?.floorGroups || d?.floorGroups || towerObj?.floorGroups || [];
  if (Array.isArray(floorGroups) && floorGroups.length > 0) {
    const allFloors = floorGroups.flatMap((g: any) => g.floors || []).filter((f: number) => f > 0);
    if (allFloors.length > 0) {
      return Math.max(...allFloors);
    }
  }

  // 4. Derive from max floor number in unit list
  if (Array.isArray(towerUnitsList) && towerUnitsList.length > 0) {
    const maxF = Math.max(...towerUnitsList.map((u: any) => Number(u.floorNumber || u.floor || 0)));
    if (maxF > 0) return maxF;
  }

  // 5. Fallback: totalUnits ÷ unitsPerFloor
  const totalUnits = Number(towerObj?.totalUnits) || Number(d?.totalUnits) || Number(towerObj?.unitCount) || Number(d?.unitCount) || 0;
  const unitsPerFloor = Number(towerObj?.unitsPerFloor) || Number(d?.unitsPerFloor) || parseInt(String(towerObj?.unitsPerFloor || d?.unitsPerFloor || "")) || 0;
  if (totalUnits > 0 && unitsPerFloor > 0) {
    return Math.round(totalUnits / unitsPerFloor);
  }

  return 0;
}

// ─── Helper: Recursively collect all towers and units ────────────────────────

async function buildHierarchy(
  rootProperty: any,
  rootId: string,
  ownershipQuery: Record<string, any>
): Promise<{ projects: any[]; towers: any[]; units: NormalizedUnit[] }> {
  const projects: any[] = [];
  const towers: any[] = [];
  let allUnits: NormalizedUnit[] = [];

  if (rootProperty.type === "township") {
    // Township → Projects → Towers → Units
    const projectDocs = await Property.find({
      parentId: rootProperty._id,
      isDeleted: false,
      status: { $nin: ["draft", "rejected"] },
      type: "project",
      ...ownershipQuery
    })
      .select("_id name details")
      .lean() as any[];
      
    // Include embedded projects if no standalone documents exist (draft/builder support)
    const embeddedProjects = (rootProperty.details?.projects || []).map((p: any) => ({
      _id: p.id,
      name: p.name || "Untitled Project",
      details: { towers: p.towers || [] },
      isEmbedded: true
    }));
    
    let validProjectDocs = projectDocs.length > 0 ? projectDocs : embeddedProjects;

    if (projectDocs.length > 0) {
      const embeddedProjectNames = new Set(
        (rootProperty.details?.projects || []).map((p: any) => p.name?.trim().toLowerCase()).filter(Boolean)
      );
      const hasEmbeddedProjectsList = embeddedProjectNames.size > 0;

      validProjectDocs = projectDocs.filter((proj: any) => {
        const projName = (proj.name || "").trim();
        const isUntitled = !projName || projName.toLowerCase().startsWith("untitled");
        
        if (hasEmbeddedProjectsList) {
          return embeddedProjectNames.has(projName.toLowerCase());
        }
        return !isUntitled; // fallback: drop untitled projects if no embedded list exists
      });
    }

    for (const proj of validProjectDocs) {
      const projIdStr = proj._id.toString();

      let towerDocs = await Property.find({
        parentId: proj._id,
        isDeleted: false,
        status: { $nin: ["draft", "rejected"] },
        type: "tower",
        ...ownershipQuery
      })
        .select("_id name details")
        .lean() as any[];
        
      // Include embedded towers
      if (towerDocs.length === 0 && proj.details?.towers) {
        towerDocs = proj.details.towers.map((t: any) => {
          const fullTower = (rootProperty.details?.towers || []).find((rt: any) => rt.id === t.id) || t;
          return {
            _id: t.id,
            name: t.name || "Untitled Tower",
            details: fullTower,
            isEmbedded: true
          };
        });
      }

      // Fetch units for this project's towers first
      const projectUnits = await fetchUnitsForTowers(towerDocs, projIdStr, ownershipQuery, rootProperty);
      allUnits.push(...projectUnits);

      // Cross-reference with the project's own embedded tower list to filter out orphaned/untitled towers
      const embeddedTowerNames = new Set(
        (proj.details?.towers || []).map((t: any) => t.name?.trim().toLowerCase()).filter(Boolean)
      );
      const hasEmbeddedList = embeddedTowerNames.size > 0;

      // Filter towerDocs: keep only real configured towers
      const validTowerDocs = towerDocs.filter((tower: any) => {
        const towerName = (tower.name || "").trim();
        const isUntitled = !towerName || towerName.toLowerCase().startsWith("untitled");
        // If the project has an embedded tower list, only show towers whose name matches
        if (hasEmbeddedList) {
          return embeddedTowerNames.has(towerName.toLowerCase());
        }
        // Otherwise, skip untitled towers with 0 units
        const towerUnitCount = projectUnits.filter((u) => u.towerId === tower._id.toString()).length;
        return !isUntitled || towerUnitCount > 0;
      });

      for (const tower of validTowerDocs) {
        const towerIdStr = tower._id.toString();
        const towerUnitCount = projectUnits.filter((u) => u.towerId === towerIdStr).length;
        // towerUnitConfigs uses frontend IDs - match by name or grab config for the tower
        const towerConfigs = rootProperty.details?.towerUnitConfigs || [];
        const towerConfig = towerConfigs.find((c: any) => {
          if (c.towerId === towerIdStr) return true;
          const matchedT = (rootProperty.details?.towers || []).find((t: any) => t.id === c.towerId && (t.name === tower.name || t._dbId === towerIdStr));
          return !!matchedT;
        });
        let baseRate = 
          parseFloat(tower.details?.baseRatePerSqft || "0") ||
          parseFloat(towerConfig?.ratePerSqft || "0") ||
          parseFloat(towerConfig?.baseRatePerSqft || "0") ||
          parseFloat(rootProperty.details?.unitTemplate?.ratePerSqft || "0") ||
          parseFloat(towerConfig?.configurations?.[0]?.ratePerSqft || "0") ||
          0;
        // Fallback: derive from unit price/area ratio
        if (!baseRate) {
          const towerUnitsList = projectUnits.filter(u => u.towerId === towerIdStr);
          const withRate = towerUnitsList.find(u => u.ratePerSqft > 0);
          if (withRate) {
            baseRate = withRate.ratePerSqft;
          } else {
            // Derive from price ÷ area (use floor 1 to avoid floor-rise distortion)
            const floor1 = towerUnitsList.find(u => (u.floorNumber === 1) && u.area > 0 && u.price > 0)
              || towerUnitsList.find(u => u.area > 0 && u.price > 0);
            if (floor1) baseRate = Math.round(floor1.price / floor1.area);
          }
        }
        const towerUnitsList = projectUnits.filter(u => u.towerId === towerIdStr);
        const derivedFloors = deriveFloorCount(tower, rootProperty.details?.towerUnitConfigs || [], towerIdStr, towerUnitsList);
        const derivedUnitsPerFloor = Number(tower.details?.unitsPerFloor) || parseInt(String(tower.details?.unitsPerFloor || "")) || 0;
        towers.push({
          _id: towerIdStr,
          name: tower.name || "Unnamed Tower",
          projectId: projIdStr,
          floorCount: derivedFloors,
          unitCount: towerUnitCount || (derivedFloors * derivedUnitsPerFloor) || 0,
          baseRate,
        });
      }

      projects.push({
        _id: projIdStr,
        name: proj.name || "Unnamed Project",
        towerCount: towerDocs.length,
        unitCount: projectUnits.length,
      });
    }

    // Direct towers of the township
    const directTowerDocs = await Property.find({
      parentId: rootProperty._id,
      isDeleted: false,
      status: { $nin: ["draft", "rejected"] },
      type: "tower",
      ...ownershipQuery
    })
      .select("_id name details")
      .lean() as any[];

    if (directTowerDocs.length > 0) {
      const directProjectUnits = await fetchUnitsForTowers(directTowerDocs, null, ownershipQuery, rootProperty);
      allUnits.push(...directProjectUnits);

      for (const tower of directTowerDocs) {
        const towerIdStr = tower._id.toString();
        const towerUnitCount = directProjectUnits.filter((u) => u.towerId === towerIdStr).length;
        const towerConfigs = rootProperty.details?.towerUnitConfigs || [];
        const towerConfig = towerConfigs.find((c: any) => c.towerId === towerIdStr || c.towerId === tower.id);
        let baseRate =
          parseFloat(tower.details?.baseRatePerSqft || "0") ||
          parseFloat(towerConfig?.ratePerSqft || "0") ||
          parseFloat(towerConfig?.baseRatePerSqft || "0") ||
          parseFloat(rootProperty.details?.unitTemplate?.ratePerSqft || "0") ||
          parseFloat(towerConfig?.configurations?.[0]?.ratePerSqft || "0") ||
          0;
        if (!baseRate) {
          const towerUnitsList = directProjectUnits.filter(u => u.towerId === towerIdStr);
          const withRate = towerUnitsList.find(u => u.ratePerSqft > 0);
          if (withRate) {
            baseRate = withRate.ratePerSqft;
          } else {
            const f1 = towerUnitsList.find(u => u.floorNumber === 1 && u.area > 0 && u.price > 0) || towerUnitsList.find(u => u.area > 0 && u.price > 0);
            if (f1) baseRate = Math.round(f1.price / f1.area);
          }
        }
        const towerUnitsList = directProjectUnits.filter(u => u.towerId === towerIdStr);
        const derivedFloors = deriveFloorCount(tower, rootProperty.details?.towerUnitConfigs || [], towerIdStr, towerUnitsList);
        const derivedUnitsPerFloor = Number(tower.details?.unitsPerFloor) || parseInt(String(tower.details?.unitsPerFloor || "")) || 0;
        towers.push({
          _id: towerIdStr,
          name: tower.name || "System Generated Tower",
          projectId: "unknown",
          floorCount: derivedFloors,
          unitCount: towerUnitCount || (derivedFloors * derivedUnitsPerFloor) || 0,
          baseRate,
        });
      }
    }
  } else if (rootProperty.type === "project") {
    // Standalone Project → Towers → Units
    const projIdStr = rootProperty._id.toString();

    let towerDocs = await Property.find({
      parentId: rootProperty._id,
      isDeleted: false,
      status: { $nin: ["draft", "rejected"] },
      type: "tower",
      ...ownershipQuery
    })
      .select("_id name details")
      .lean() as any[];
      
    // Include embedded towers if no standalone documents exist (draft/builder support)
    if (towerDocs.length === 0 && rootProperty.details?.towers) {
      towerDocs = rootProperty.details.towers.map((t: any) => ({
        _id: t.id,
        name: t.name || "Untitled Tower",
        details: t,
        isEmbedded: true
      }));
    }

    const projectUnits = await fetchUnitsForTowers(towerDocs, projIdStr, ownershipQuery, rootProperty);
    allUnits.push(...projectUnits);

    for (const tower of towerDocs) {
      const towerIdStr = tower._id.toString();
      const towerUnitCount = projectUnits.filter((u) => u.towerId === towerIdStr).length;
      const towerConfigs = rootProperty.details?.towerUnitConfigs || [];
      const towerConfig = towerConfigs.find((c: any) => {
        if (c.towerId === towerIdStr) return true;
        const matchedT = (rootProperty.details?.towers || []).find((t: any) => t.id === c.towerId && (t.name === tower.name || t._dbId === towerIdStr));
        return !!matchedT;
      });
      let baseRate =
        parseFloat(tower.details?.baseRatePerSqft || "0") ||
        parseFloat(towerConfig?.ratePerSqft || "0") ||
        parseFloat(towerConfig?.baseRatePerSqft || "0") ||
        parseFloat(rootProperty.details?.unitTemplate?.ratePerSqft || "0") ||
        parseFloat(towerConfig?.configurations?.[0]?.ratePerSqft || "0") ||
        0;
      if (!baseRate) {
        const towerUnitsList = projectUnits.filter(u => u.towerId === towerIdStr);
        const withRate = towerUnitsList.find(u => u.ratePerSqft > 0);
        if (withRate) {
          baseRate = withRate.ratePerSqft;
        } else {
          const f1 = towerUnitsList.find(u => u.floorNumber === 1 && u.area > 0 && u.price > 0) || towerUnitsList.find(u => u.area > 0 && u.price > 0);
          if (f1) baseRate = Math.round(f1.price / f1.area);
        }
      }
        const towerUnitsList = projectUnits.filter(u => u.towerId === towerIdStr);
        const derivedFloors = deriveFloorCount(tower, rootProperty.details?.towerUnitConfigs || [], towerIdStr, towerUnitsList);
      const derivedUnitsPerFloor = Number(tower.details?.unitsPerFloor) || parseInt(String(tower.details?.unitsPerFloor || "")) || 0;
      towers.push({
        _id: towerIdStr,
        name: tower.name || "Unnamed Tower",
        projectId: projIdStr,
        floorCount: derivedFloors,
        unitCount: towerUnitCount || (derivedFloors * derivedUnitsPerFloor) || 0,
        baseRate,
      });
    }

    projects.push({
      _id: projIdStr,
      name: rootProperty.name || "Unnamed Project",
      towerCount: towerDocs.length,
      unitCount: projectUnits.length,
    });
  } else if (rootProperty.type === "tower") {
    // Standalone Tower → Units
    const towerDocs = [rootProperty]; // The root IS the tower
    const towerIdStr = rootProperty._id.toString();

    const towerUnits = await fetchUnitsForTowers(towerDocs, null, ownershipQuery, rootProperty);
    allUnits.push(...towerUnits);

    // For standalone tower: towerUnitConfigs may use frontend ID (e.g. 'tower-standalone-1'),
    // so just grab the first config if it exists, or fall back to unitTemplate.
    const anyTowerConfig = (rootProperty.details?.towerUnitConfigs || [])[0];
    
    // Helper: safely derive base rate from a list of unit-like objects
    const deriveRateFromUnits = (units: any[]): number => {
      // Try ratePerSqft directly
      const withRate = units.find((u: any) => parseFloat(u.ratePerSqft) > 0);
      if (withRate) return parseFloat(withRate.ratePerSqft);
      // Try price ÷ area (for floor 1 unit to avoid floor-rise distortion)
      const floor1Unit = units.find((u: any) => 
        (u.floor === 1 || u.floorNumber === 1) && (u.area || u.carpetArea) > 0 && u.price > 0
      ) || units.find((u: any) => (u.area || u.carpetArea) > 0 && u.price > 0);
      if (floor1Unit) {
        const area = floor1Unit.area || floor1Unit.carpetArea;
        return Math.round(floor1Unit.price / area);
      }
      return 0;
    };

    let baseRate = 
      parseFloat(rootProperty.details?.baseRatePerSqft || "0") ||
      parseFloat(anyTowerConfig?.ratePerSqft || "0") ||
      parseFloat(anyTowerConfig?.baseRatePerSqft || "0") ||
      parseFloat(rootProperty.details?.unitTemplate?.ratePerSqft || "0") ||
      // Check configurations array ratePerSqft
      parseFloat(anyTowerConfig?.configurations?.[0]?.ratePerSqft || "0") ||
      0;
    // Final fallback: derive from unit prices/areas
    if (!baseRate) {
      const embeddedUnits: any[] = rootProperty.details?.generatedUnits || [];
      baseRate = deriveRateFromUnits(towerUnits) || deriveRateFromUnits(embeddedUnits);
    }
    const derivedFloors = deriveFloorCount(rootProperty, rootProperty.details?.towerUnitConfigs || [], towerIdStr, towerUnits);
    const derivedUnitsPerFloor = Number(rootProperty.details?.unitsPerFloor) || parseInt(String(rootProperty.details?.unitsPerFloor || "")) || 0;
    towers.push({
      _id: towerIdStr,
      name: rootProperty.name || "Unnamed Tower",
      projectId: null,
      floorCount: derivedFloors,
      unitCount: towerUnits.length || (derivedFloors * derivedUnitsPerFloor) || 0,
      baseRate: Number(baseRate),
    });
  }

  return { projects, towers, units: allUnits };
}

// ─── GET /api/inventory/[propertyId] ─────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader"]);
    if (errorResponse) return errorResponse;

    if (!/^[a-f\d]{24}$/i.test(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    await dbConnect();

    let ownershipQuery = getOwnershipQuery(context!);
    if (context!.role === "builder") {
      // Use the robust ownership query from RBAC but ensure mandate properties are excluded
      ownershipQuery = { ...ownershipQuery, role: { $ne: 'mandate' } };
    } else if (context!.role === "teamLeader") {
      // Verify team leader is assigned to this exact property
      const leaderDoc = await User.findById(context!.userId).lean();
      if (!leaderDoc || leaderDoc.profile?.propertyId !== propertyId) {
         return NextResponse.json({ error: "Unauthorized access to this property" }, { status: 403 });
      }
      // Empty ownershipQuery for children lookups since we validated access to root
      ownershipQuery = {};
      console.log("DEBUG: teamLeader ownership query set to", ownershipQuery);
    }

    // 1. Verify root property ownership — no status restriction so draft previews also work
    //    (inventory API called after publishing, but being lenient here lets dev test)
    const rootProperty = await Property.findOne({
      _id: propertyId,
      ...(context!.role !== "teamLeader" ? ownershipQuery : {}),
      isDeleted: false,
    }).lean() as any;

    if (!rootProperty) {
      // Retry without status restriction in case status mismatch
      const anyProp = await Property.findById(propertyId).select("_id status role builderId").lean() as any;
      if (!anyProp) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
      console.warn(
        `[GET /api/inventory/${propertyId}] Ownership mismatch. ` +
        `Property role=${anyProp?.role}, builderId=${anyProp?.builderId}, ` +
        `context role=${context!.role}, userId=${context!.userId}`
      );
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    // 2. Build full hierarchy
    const { projects, towers, units } = await buildHierarchy(rootProperty, propertyId, ownershipQuery);

    // 3. Debug logging
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[GET /api/inventory/${propertyId}] type=${rootProperty.type} ` +
        `→ projects=${projects.length}, towers=${towers.length}, units=${units.length} ` +
        `(collection=${units.filter((u) => u.source === "collection").length}, ` +
        `embedded=${units.filter((u) => u.source === "embedded").length})`
      );
    }

    return NextResponse.json(
      {
        property: {
          _id: rootProperty._id.toString(),
          name: rootProperty.name || "Unnamed Property",
          type: rootProperty.type as string,
          flowType: (rootProperty.flowType || rootProperty.type) as string,
          location: rootProperty.location || {},
          status: rootProperty.status,
        },
        projects,
        towers,
        units,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, must-revalidate" },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/inventory/[propertyId]] error:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch inventory hierarchy" }, { status: 500 });
  }
}
