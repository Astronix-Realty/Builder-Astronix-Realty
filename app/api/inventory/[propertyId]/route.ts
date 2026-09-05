import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import User from "@/models/User";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

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
  carpetArea?: number;
  builtUpArea?: number;
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

// ─── Helper: Derive floor count from tower details ───────────────────────────

function deriveFloorCount(towerObj: any, towerUnitConfigs: any[], towerId: string, towerUnitsList: any[] = []): number {
  if (!towerObj) return 0;
  const d = towerObj.details || towerObj;

  // 1. Direct numeric fields
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

// ─── Helper: Build Canonical & Deduplicated Hierarchy ─────────────────────────

async function buildHierarchy(
  rootProperty: any,
  rootId: string,
  ownershipQuery: Record<string, any>
): Promise<{ projects: any[]; towers: any[]; units: NormalizedUnit[] }> {
  const rootEmbeddedUnits: any[] = rootProperty?.details?.generatedUnits || [];
  const rootProjects: any[] = rootProperty?.details?.projects || [];
  const rootTowers: any[] = rootProperty?.details?.towers || [];
  const towerConfigs: any[] = rootProperty?.details?.towerUnitConfigs || [];

  const projects: any[] = [];
  const towers: any[] = [];
  const allUnits: NormalizedUnit[] = [];
  const seenUnitKeys = new Set<string>();

  if (rootProperty.type === "township") {
    // 1. Fetch child project documents from DB
    const dbProjectDocs = await Property.find({
      parentId: rootProperty._id,
      isDeleted: false,
      status: { $ne: "rejected" },
      type: "project",
      ...ownershipQuery,
    }).sort({ updatedAt: -1 }).lean() as any[];

    // 2. Canonical Project Resolution:
    // If rootProjects exists, resolve 1 project per entry in rootProjects (deduplicating multiple DB records)
    // Otherwise deduplicate dbProjectDocs by name (taking latest updatedAt)
    const canonicalProjects: { _id: string; name: string; frontendId: string | null; dbDoc: any; isEmbedded: boolean; details?: any }[] = [];
    if (rootProjects.length > 0) {
      for (const p of rootProjects) {
        const matchedDbDoc = dbProjectDocs.find((dbP) =>
          dbP._id.toString() === p.id ||
          dbP.name?.trim().toLowerCase() === p.name?.trim().toLowerCase()
        );
        canonicalProjects.push({
          _id: matchedDbDoc ? matchedDbDoc._id.toString() : (p.id || p._id?.toString()),
          name: p.name || matchedDbDoc?.name || "Unnamed Project",
          frontendId: p.id || null,
          dbDoc: matchedDbDoc,
          isEmbedded: !matchedDbDoc,
          details: p,
        });
      }
    } else if (dbProjectDocs.length > 0) {
      const seenNames = new Set<string>();
      for (const dbP of dbProjectDocs) {
        const normName = (dbP.name || "").trim().toLowerCase();
        if (!seenNames.has(normName) && !normName.startsWith("untitled")) {
          seenNames.add(normName);
          canonicalProjects.push({
            _id: dbP._id.toString(),
            name: dbP.name || "Unnamed Project",
            frontendId: null,
            dbDoc: dbP,
            isEmbedded: false,
          });
        }
      }
    }

    // 3. Process each canonical project and its towers
    for (const proj of canonicalProjects) {
      const projIdStr = proj._id;
      const projUnits: NormalizedUnit[] = [];

      // Find canonical towers for this project:
      // A) Towers in rootTowers matching projectId
      let projectDefinedTowers = rootTowers.filter((t: any) =>
        t.projectId === proj.frontendId ||
        t.projectId === proj._id ||
        (proj.dbDoc && t.projectId === proj.dbDoc._id.toString())
      );

      // If rootTowers doesn't have projectId, check proj details or rootProjects towers
      if (projectDefinedTowers.length === 0) {
        const origProj = rootProjects.find((p: any) => p.id === proj.frontendId || p.name === proj.name);
        if (origProj && Array.isArray(origProj.towers)) {
          projectDefinedTowers = origProj.towers;
        }
      }

      let dbTowerDocs: any[] = [];
      if (proj.dbDoc) {
        dbTowerDocs = await Property.find({
          parentId: proj.dbDoc._id,
          isDeleted: false,
          status: { $ne: "rejected" },
          type: "tower",
          ...ownershipQuery,
        }).sort({ updatedAt: -1 }).lean() as any[];
      }

      const canonicalTowers: { _id: string; name: string; frontendId: string | null; details: any; dbDoc: any }[] = [];
      if (projectDefinedTowers.length > 0) {
        for (const t of projectDefinedTowers) {
          const matchedDbTower = dbTowerDocs.find((dbT) =>
            dbT._id.toString() === t.id ||
            dbT.name?.trim().toLowerCase() === t.name?.trim().toLowerCase()
          );
          canonicalTowers.push({
            _id: matchedDbTower ? matchedDbTower._id.toString() : (t.id || t._id?.toString()),
            name: t.name || matchedDbTower?.name || "Unnamed Tower",
            frontendId: t.id || null,
            details: t,
            dbDoc: matchedDbTower,
          });
        }
      } else if (dbTowerDocs.length > 0) {
        const seenTowerNames = new Set<string>();
        for (const dbT of dbTowerDocs) {
          const normName = (dbT.name || "").trim().toLowerCase();
          if (!seenTowerNames.has(normName) && !normName.startsWith("untitled")) {
            seenTowerNames.add(normName);
            canonicalTowers.push({
              _id: dbT._id.toString(),
              name: dbT.name || "Unnamed Tower",
              frontendId: null,
              details: dbT.details || dbT,
              dbDoc: dbT,
            });
          }
        }
      }

      // Process units for canonical towers
      for (const tower of canonicalTowers) {
        const towerIdStr = tower._id;
        const frontendTowerId = tower.frontendId;

        // Try DB units first
        let towerUnits: any[] = [];
        if (tower.dbDoc) {
          towerUnits = await Unit.find({
            towerId: tower.dbDoc._id,
            status: { $ne: "rejected" },
          }).lean();
        }

        // Fallback to embedded units
        if (towerUnits.length === 0 && rootEmbeddedUnits.length > 0) {
          towerUnits = rootEmbeddedUnits.filter((u: any) => {
            if (frontendTowerId && u.towerId === frontendTowerId) return true;
            if (u.towerId === towerIdStr) return true;
            if (tower.dbDoc && u.towerId === tower.dbDoc._id.toString()) return true;
            return false;
          });
        }

        // Normalize & Deduplicate units
        const normalizedTowerUnits: NormalizedUnit[] = [];
        for (const u of towerUnits) {
          const unitNum = u.unitNumber || "";
          const floorNum = u.floorNumber || u.floor || 0;
          const unitKey = `${towerIdStr}-${unitNum}-${floorNum}`;

          if (seenUnitKeys.has(unitKey)) continue;
          seenUnitKeys.add(unitKey);

          const normU: NormalizedUnit = {
            _id: u.id || u.originalId || u._id?.toString() || unitKey,
            id: u.id || u.originalId || u._id?.toString() || unitKey,
            unitNumber: unitNum,
            floorNumber: floorNum,
            configuration: u.configuration || u.type || "",
            area: u.area || u.carpetArea || 0,
            carpetArea: u.carpetArea || u.area || 0,
            builtUpArea: u.builtUpArea || 0,
            price: u.price || 0,
            ratePerSqft: u.ratePerSqft || 0,
            status: u.status || "available",
            towerId: towerIdStr,
            projectId: projIdStr,
            customerName: u.customerName || "",
            customerPhone: u.customerPhone || "",
            bookingAmount: u.bookingAmount || 0,
            bookingDate: u.bookingDate || null,
            facing: u.facing || "",
            source: u._id && mongoose.isValidObjectId(u._id) ? "collection" : "embedded",
          };

          normalizedTowerUnits.push(normU);
        }

        projUnits.push(...normalizedTowerUnits);
        allUnits.push(...normalizedTowerUnits);

        // Derive baseRate & floor count
        const towerConfig = towerConfigs.find((c: any) =>
          c.towerId === towerIdStr ||
          c.towerId === frontendTowerId ||
          c.towerId === tower.name
        );
        let baseRate =
          parseFloat(tower.details?.baseRatePerSqft || "0") ||
          parseFloat(towerConfig?.ratePerSqft || "0") ||
          parseFloat(towerConfig?.baseRatePerSqft || "0") ||
          parseFloat(rootProperty.details?.unitTemplate?.ratePerSqft || "0") ||
          0;

        if (!baseRate && normalizedTowerUnits.length > 0) {
          const withRate = normalizedTowerUnits.find((u) => u.ratePerSqft > 0);
          if (withRate) baseRate = withRate.ratePerSqft;
        }

        const derivedFloors = deriveFloorCount(tower.details, towerConfigs, towerIdStr, normalizedTowerUnits);
        const derivedUnitsPerFloor = Number(tower.details?.unitsPerFloor) || parseInt(String(tower.details?.unitsPerFloor || "")) || 0;

        towers.push({
          _id: towerIdStr,
          name: tower.name,
          projectId: projIdStr,
          floorCount: derivedFloors,
          unitCount: normalizedTowerUnits.length || (derivedFloors * derivedUnitsPerFloor) || 0,
          baseRate,
        });
      }

      projects.push({
        _id: projIdStr,
        name: proj.name,
        towerCount: canonicalTowers.length,
        unitCount: projUnits.length,
        reraNumber: proj.dbDoc?.reraNumber || proj.dbDoc?.details?.reraNumber || proj.details?.reraNumber || "",
      });
    }

    // Check for any unassigned towers directly on the township
    const assignedTowerNames = new Set(towers.map((t) => t.name?.trim().toLowerCase()));
    const unassignedRootTowers = rootTowers.filter((t: any) => {
      const normTName = (t.name || "").trim().toLowerCase();
      return !assignedTowerNames.has(normTName);
    });

    for (const t of unassignedRootTowers) {
      const towerIdStr = t.id || t._id?.toString() || `tower-${t.name}`;
      const towerUnits = rootEmbeddedUnits.filter((u: any) => u.towerId === towerIdStr || u.towerId === t.id);
      const derivedFloors = deriveFloorCount(t.details || t, towerConfigs, towerIdStr, towerUnits);
      const derivedUnitsPerFloor = Number(t.unitsPerFloor) || Number(t.details?.unitsPerFloor) || 0;
      towers.push({
        _id: towerIdStr,
        name: t.name || "Direct Tower",
        projectId: null,
        floorCount: derivedFloors,
        unitCount: towerUnits.length || (derivedFloors * derivedUnitsPerFloor) || 0,
        baseRate: parseFloat(t.details?.baseRatePerSqft || t.baseRate || "0") || 0,
      });
    }
  } else if (rootProperty.type === "project") {
    // Standalone Project → Towers → Units
    const projIdStr = rootProperty._id.toString();

    let dbTowerDocs = await Property.find({
      parentId: rootProperty._id,
      isDeleted: false,
      status: { $ne: "rejected" },
      type: "tower",
      ...ownershipQuery,
    }).sort({ updatedAt: -1 }).lean() as any[];

    const canonicalTowers: { _id: string; name: string; frontendId: string | null; details: any; dbDoc: any }[] = [];
    if (rootTowers.length > 0) {
      for (const t of rootTowers) {
        const matchedDbTower = dbTowerDocs.find((dbT) =>
          dbT._id.toString() === t.id ||
          dbT.name?.trim().toLowerCase() === t.name?.trim().toLowerCase()
        );
        canonicalTowers.push({
          _id: matchedDbTower ? matchedDbTower._id.toString() : (t.id || t._id?.toString()),
          name: t.name || matchedDbTower?.name || "Unnamed Tower",
          frontendId: t.id || null,
          details: t,
          dbDoc: matchedDbTower,
        });
      }
    } else if (dbTowerDocs.length > 0) {
      const seenNames = new Set<string>();
      for (const dbT of dbTowerDocs) {
        const normName = (dbT.name || "").trim().toLowerCase();
        if (!seenNames.has(normName) && !normName.startsWith("untitled")) {
          seenNames.add(normName);
          canonicalTowers.push({
            _id: dbT._id.toString(),
            name: dbT.name || "Unnamed Tower",
            frontendId: null,
            details: dbT.details || dbT,
            dbDoc: dbT,
          });
        }
      }
    }

    const projUnits: NormalizedUnit[] = [];
    for (const tower of canonicalTowers) {
      const towerIdStr = tower._id;
      const frontendTowerId = tower.frontendId;

      let towerUnits: any[] = [];
      if (tower.dbDoc) {
        towerUnits = await Unit.find({
          towerId: tower.dbDoc._id,
          status: { $ne: "rejected" },
        }).lean();
      }

      if (towerUnits.length === 0 && rootEmbeddedUnits.length > 0) {
        towerUnits = rootEmbeddedUnits.filter((u: any) => {
          if (frontendTowerId && u.towerId === frontendTowerId) return true;
          if (u.towerId === towerIdStr) return true;
          if (tower.dbDoc && u.towerId === tower.dbDoc._id.toString()) return true;
          return false;
        });
      }

      const normalizedTowerUnits: NormalizedUnit[] = [];
      for (const u of towerUnits) {
        const unitNum = u.unitNumber || "";
        const floorNum = u.floorNumber || u.floor || 0;
        const unitKey = `${towerIdStr}-${unitNum}-${floorNum}`;
        if (seenUnitKeys.has(unitKey)) continue;
        seenUnitKeys.add(unitKey);

        const normU: NormalizedUnit = {
          _id: u.id || u.originalId || u._id?.toString() || unitKey,
          id: u.id || u.originalId || u._id?.toString() || unitKey,
          unitNumber: unitNum,
          floorNumber: floorNum,
          configuration: u.configuration || u.type || "",
          area: u.area || u.carpetArea || 0,
          carpetArea: u.carpetArea || u.area || 0,
          builtUpArea: u.builtUpArea || 0,
          price: u.price || 0,
          ratePerSqft: u.ratePerSqft || 0,
          status: u.status || "available",
          towerId: towerIdStr,
          projectId: projIdStr,
          customerName: u.customerName || "",
          customerPhone: u.customerPhone || "",
          bookingAmount: u.bookingAmount || 0,
          bookingDate: u.bookingDate || null,
          facing: u.facing || "",
          source: u._id && mongoose.isValidObjectId(u._id) ? "collection" : "embedded",
        };
        normalizedTowerUnits.push(normU);
      }

      projUnits.push(...normalizedTowerUnits);
      allUnits.push(...normalizedTowerUnits);

      const towerConfig = towerConfigs.find((c: any) => c.towerId === towerIdStr || c.towerId === frontendTowerId);
      let baseRate =
        parseFloat(tower.details?.baseRatePerSqft || "0") ||
        parseFloat(towerConfig?.ratePerSqft || "0") ||
        parseFloat(rootProperty.details?.unitTemplate?.ratePerSqft || "0") || 0;

      const derivedFloors = deriveFloorCount(tower.details, towerConfigs, towerIdStr, normalizedTowerUnits);
      const derivedUnitsPerFloor = Number(tower.details?.unitsPerFloor) || parseInt(String(tower.details?.unitsPerFloor || "")) || 0;

      towers.push({
        _id: towerIdStr,
        name: tower.name,
        projectId: projIdStr,
        floorCount: derivedFloors,
        unitCount: normalizedTowerUnits.length || (derivedFloors * derivedUnitsPerFloor) || 0,
        baseRate,
      });
    }

    projects.push({
      _id: projIdStr,
      name: rootProperty.name || "Unnamed Project",
      towerCount: canonicalTowers.length,
      unitCount: projUnits.length,
    });
  } else if (rootProperty.type === "tower") {
    // Standalone Tower → Units
    const towerIdStr = rootProperty._id.toString();
    let towerUnits: any[] = await Unit.find({
      towerId: rootProperty._id,
      status: { $ne: "rejected" },
    }).lean() as any[];

    if (towerUnits.length === 0 && rootEmbeddedUnits.length > 0) {
      towerUnits = rootEmbeddedUnits;
    }

    const normalizedTowerUnits: NormalizedUnit[] = [];
    for (const u of towerUnits) {
      const unitNum = u.unitNumber || "";
      const floorNum = u.floorNumber || u.floor || 0;
      const unitKey = `${towerIdStr}-${unitNum}-${floorNum}`;
      if (seenUnitKeys.has(unitKey)) continue;
      seenUnitKeys.add(unitKey);

      const normU: NormalizedUnit = {
        _id: u.id || u.originalId || u._id?.toString() || unitKey,
        id: u.id || u.originalId || u._id?.toString() || unitKey,
        unitNumber: unitNum,
        floorNumber: floorNum,
        configuration: u.configuration || u.type || "",
        area: u.area || u.carpetArea || 0,
        carpetArea: u.carpetArea || u.area || 0,
        builtUpArea: u.builtUpArea || 0,
        price: u.price || 0,
        ratePerSqft: u.ratePerSqft || 0,
        status: u.status || "available",
        towerId: towerIdStr,
        projectId: null,
        customerName: u.customerName || "",
        customerPhone: u.customerPhone || "",
        bookingAmount: u.bookingAmount || 0,
        bookingDate: u.bookingDate || null,
        facing: u.facing || "",
        source: u._id && mongoose.isValidObjectId(u._id) ? "collection" : "embedded",
      };
      normalizedTowerUnits.push(normU);
    }

    allUnits.push(...normalizedTowerUnits);

    const derivedFloors = deriveFloorCount(rootProperty, towerConfigs, towerIdStr, normalizedTowerUnits);
    const derivedUnitsPerFloor = Number(rootProperty.details?.unitsPerFloor) || parseInt(String(rootProperty.details?.unitsPerFloor || "")) || 0;
    const baseRate = parseFloat(rootProperty.details?.baseRatePerSqft || "0") || parseFloat(rootProperty.details?.unitTemplate?.ratePerSqft || "0") || 0;

    towers.push({
      _id: towerIdStr,
      name: rootProperty.name || "Unnamed Tower",
      projectId: null,
      floorCount: derivedFloors,
      unitCount: normalizedTowerUnits.length || (derivedFloors * derivedUnitsPerFloor) || 0,
      baseRate,
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
      ownershipQuery = { ...ownershipQuery, role: { $ne: 'mandate' } };
    } else if (context!.role === "teamLeader") {
      const leaderDoc = await User.findById(context!.userId).lean();
      if (!leaderDoc || leaderDoc.profile?.propertyId !== propertyId) {
        return NextResponse.json({ error: "Unauthorized access to this property" }, { status: 403 });
      }
      ownershipQuery = {};
    }

    // 1. Verify root property ownership
    const rootProperty = await Property.findOne({
      _id: propertyId,
      ...(context!.role !== "teamLeader" ? ownershipQuery : {}),
      isDeleted: false,
    }).lean() as any;

    if (!rootProperty) {
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

    // 2. Resolve parent hierarchy (if this property is a child project or child tower)
    const parentHierarchy: {
      township?: { _id: string; name: string; type: string; reraNumber?: string };
      project?: { _id: string; name: string; type: string; reraNumber?: string };
    } = {};

    if (rootProperty.parentId) {
      const parentDoc = await Property.findById(rootProperty.parentId).lean() as any;
      if (parentDoc) {
        if (parentDoc.type === "township") {
          parentHierarchy.township = {
            _id: parentDoc._id.toString(),
            name: parentDoc.name || parentDoc.details?.township?.name || "Parent Township",
            type: "township",
            reraNumber: parentDoc.reraNumber || parentDoc.details?.reraNumber,
          };
        } else if (parentDoc.type === "project") {
          parentHierarchy.project = {
            _id: parentDoc._id.toString(),
            name: parentDoc.name || "Parent Project",
            type: "project",
            reraNumber: parentDoc.reraNumber || parentDoc.details?.reraNumber,
          };
          if (parentDoc.parentId) {
            const grandParentDoc = await Property.findById(parentDoc.parentId).lean() as any;
            if (grandParentDoc && grandParentDoc.type === "township") {
              parentHierarchy.township = {
                _id: grandParentDoc._id.toString(),
                name: grandParentDoc.name || grandParentDoc.details?.township?.name || "Parent Township",
                type: "township",
                reraNumber: grandParentDoc.reraNumber || grandParentDoc.details?.reraNumber,
              };
            }
          }
        }
      }
    }

    if (!parentHierarchy.township && rootProperty.details?.township?.name) {
      parentHierarchy.township = {
        _id: rootProperty.details.township.id || "township-ref",
        name: rootProperty.details.township.name,
        type: "township",
        reraNumber: rootProperty.details.township.reraNumber || rootProperty.details?.reraNumber,
      };
    }

    // 3. Build full hierarchy
    const { projects, towers, units } = await buildHierarchy(rootProperty, propertyId, ownershipQuery);

    // 4. Debug logging
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
          reraNumber: rootProperty.reraNumber || rootProperty.details?.reraNumber || rootProperty.details?.township?.reraNumber || "",
          parentId: rootProperty.parentId ? rootProperty.parentId.toString() : null,
          parentHierarchy,
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
