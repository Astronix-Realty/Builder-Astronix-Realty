import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
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
    for (const tower of towerDocs) {
      if (tower.details?.generatedUnits && Array.isArray(tower.details.generatedUnits)) {
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
        const relevantUnits = tower.details.generatedUnits.filter((u: any) => {
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
      .lean();

    for (const proj of projectDocs as any[]) {
      const projIdStr = proj._id.toString();

      const towerDocs = await Property.find({
        parentId: proj._id,
        isDeleted: false,
        status: { $nin: ["draft", "rejected"] },
        type: "tower",
        ...ownershipQuery
      })
        .select("_id name details")
        .lean() as any[];

      // Fetch units for this project's towers
      const projectUnits = await fetchUnitsForTowers(towerDocs, projIdStr, ownershipQuery);
      allUnits.push(...projectUnits);

      for (const tower of towerDocs) {
        const towerIdStr = tower._id.toString();
        const towerUnitCount = projectUnits.filter((u) => u.towerId === towerIdStr).length;
        towers.push({
          _id: towerIdStr,
          name: tower.name || "Unnamed Tower",
          projectId: projIdStr,
          floorCount: tower.details?.floors || 0,
          unitCount: towerUnitCount,
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
      const directProjectUnits = await fetchUnitsForTowers(directTowerDocs, null, ownershipQuery);
      allUnits.push(...directProjectUnits);

      for (const tower of directTowerDocs) {
        const towerIdStr = tower._id.toString();
        const towerUnitCount = directProjectUnits.filter((u) => u.towerId === towerIdStr).length;
        towers.push({
          _id: towerIdStr,
          name: tower.name || "System Generated Tower",
          projectId: "unknown",
          floorCount: tower.details?.floors || 0,
          unitCount: towerUnitCount,
        });
      }
    }
  } else if (rootProperty.type === "project") {
    // Standalone Project → Towers → Units
    const projIdStr = rootProperty._id.toString();

    const towerDocs = await Property.find({
      parentId: rootProperty._id,
      isDeleted: false,
      status: { $nin: ["draft", "rejected"] },
      type: "tower",
      ...ownershipQuery
    })
      .select("_id name details")
      .lean() as any[];

    const projectUnits = await fetchUnitsForTowers(towerDocs, projIdStr, ownershipQuery);
    allUnits.push(...projectUnits);

    for (const tower of towerDocs) {
      const towerIdStr = tower._id.toString();
      const towerUnitCount = projectUnits.filter((u) => u.towerId === towerIdStr).length;
      towers.push({
        _id: towerIdStr,
        name: tower.name || "Unnamed Tower",
        projectId: projIdStr,
        floorCount: tower.details?.floors || 0,
        unitCount: towerUnitCount,
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

    const towerUnits = await fetchUnitsForTowers(towerDocs, null, ownershipQuery);
    allUnits.push(...towerUnits);

    towers.push({
      _id: towerIdStr,
      name: rootProperty.name || "Unnamed Tower",
      projectId: null,
      floorCount: rootProperty.details?.floors || 0,
      unitCount: towerUnits.length,
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
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate"]);
    if (errorResponse) return errorResponse;

    if (!/^[a-f\d]{24}$/i.test(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    await dbConnect();

    let ownershipQuery = getOwnershipQuery(context!);
    if (context!.role === "builder") {
      ownershipQuery = { builderId: context!.userId, role: { $ne: 'mandate' } };
    }

    // 1. Verify root property ownership — no status restriction so draft previews also work
    //    (inventory API called after publishing, but being lenient here lets dev test)
    const rootProperty = await Property.findOne({
      _id: propertyId,
      ...ownershipQuery,
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
