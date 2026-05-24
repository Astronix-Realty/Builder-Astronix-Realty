import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Unit statuses that represent active inventory (not pre-publication states)
const INVENTORY_STATUSES = ["available", "sold", "blocked", "reserved", "booked", "published", "archived"];

/**
 * Count units for a set of tower property documents.
 * Multi-strategy: tries Unit collection first, then falls back to embedded details.generatedUnits
 */
async function countUnitsForTowers(towerDocs: any[], ownershipQuery: Record<string, any>): Promise<number> {
  if (towerDocs.length === 0) return 0;

  const towerMongoIds = towerDocs.map((t) => t._id);

  // Strategy 1: Unit collection (published units)
  let count = await Unit.countDocuments({
    towerId: { $in: towerMongoIds },
    status: { $in: INVENTORY_STATUSES },
    ...ownershipQuery,
  });

  if (count === 0) {
    // Broader net - any non-draft/pending/rejected unit
    count = await Unit.countDocuments({
      towerId: { $in: towerMongoIds },
      status: { $nin: ["draft", "pending", "rejected"] },
      ...ownershipQuery,
    });
  }

  return count;
}

/**
 * GET /api/inventory
 * Returns a role-isolated list of root-level properties that have inventory.
 * Includes all published + active properties (status: published or active).
 */
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    let ownershipQuery = getOwnershipQuery(context!);
    
    // Relax ownership query for builder to only check builderId, ignoring strict accountId matches.
    if (context!.role === "builder") {
      ownershipQuery = { builderId: context!.userId, role: { $ne: 'mandate' } };
    }

    // Root-level, non-deleted, published properties owned by this user
    const rootProperties = await Property.find({
      ...ownershipQuery,
      parentId: null,
      isDeleted: false,
      status: { $in: ["published", "active", "pending"] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[GET /api/inventory] role=${context!.role} userId=${context!.userId} ` +
        `→ found ${rootProperties.length} root properties`
      );
    }

    // Build inventory summary per root property
    const inventorySummary = await Promise.all(
      rootProperties.map(async (prop: any) => {
        let projectCount = 0;
        let towerCount = 0;
        let unitCount = 0;

        if (prop.type === "township") {
          const projects = await Property.find({
            parentId: prop._id,
            type: "project",
            isDeleted: false,
            status: { $nin: ["draft", "rejected"] },
            ...ownershipQuery,
          })
            .select("_id name")
            .lean();

          projectCount = projects.length;

          const projectIds = projects.map((p: any) => p._id);
          const towerDocs = await Property.find({
            $or: [
              { parentId: { $in: projectIds } },
              { parentId: prop._id }
            ],
            type: "tower",
            isDeleted: false,
            status: { $nin: ["draft", "rejected"] },
            ...ownershipQuery,
          })
            .select("_id name details")
            .lean();

          towerCount = towerDocs.length;
          unitCount = await countUnitsForTowers(towerDocs, ownershipQuery);
        } else if (prop.type === "project") {
          projectCount = 1;
          const towerDocs = await Property.find({
            parentId: prop._id,
            type: "tower",
            isDeleted: false,
            status: { $nin: ["draft", "rejected"] },
            ...ownershipQuery,
          })
            .select("_id name details")
            .lean();

          towerCount = towerDocs.length;
          unitCount = await countUnitsForTowers(towerDocs, ownershipQuery);
        } else if (prop.type === "tower") {
          towerCount = 1;
          unitCount = await countUnitsForTowers([prop], ownershipQuery);
        }

        if (process.env.NODE_ENV !== "production") {
          console.log(
            `  [property ${prop._id}] "${prop.name}" (${prop.type}) ` +
            `→ projects=${projectCount}, towers=${towerCount}, units=${unitCount}`
          );
        }

        return {
          _id: prop._id.toString(),
          name: prop.name || "Unnamed Property",
          type: prop.type as "township" | "project" | "tower",
          flowType: (prop.flowType || prop.type) as string,
          location: prop.location || {},
          projectCount,
          towerCount,
          unitCount,
          thumbnail: prop.details?.heroImage || prop.details?.township?.heroImage || null,
          status: prop.status,
          updatedAt: prop.updatedAt,
        };
      })
    );

    return NextResponse.json(
      { properties: inventorySummary },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, must-revalidate" },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/inventory] error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch inventory properties" },
      { status: 500 }
    );
  }
}
