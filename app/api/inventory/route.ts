import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import User from "@/models/User";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Unit statuses that represent active inventory (not pre-publication states)
const INVENTORY_STATUSES = ["available", "sold", "blocked", "reserved", "booked", "published", "archived"];


/**
 * GET /api/inventory
 * Returns a role-isolated list of root-level properties that have inventory.
 * Includes all published + active properties (status: published or active).
 */
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    let ownershipQuery = getOwnershipQuery(context!);
    
    // Relax ownership query for builder to only check builderId, ignoring strict accountId matches.
    if (context!.role === "builder") {
      ownershipQuery = { builderId: context!.userId, role: { $ne: 'mandate' } };
    } else if (context!.role === "teamLeader") {
      const leaderDoc = await User.findById(context!.userId).lean();
      if (!leaderDoc || !leaderDoc.profile?.propertyId) {
         return NextResponse.json({ properties: [] }, { status: 200 });
      }
      ownershipQuery = { _id: leaderDoc.profile.propertyId };
    }

    // Root-level, non-deleted, published properties owned by this user
    const rootProperties = await Property.find({
      ...ownershipQuery,
      parentId: null,
      isDeleted: { $ne: true },
      status: { $in: ["published", "active", "pending"] },
    })
      .select('-details.generatedUnits -details.units')
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
          projectCount = prop.details?.projectCount || prop.details?.projects?.length || 0;
          towerCount = prop.details?.totalTowers || prop.details?.towers?.length || 0;
          unitCount = prop.details?.totalUnits || prop.details?.generatedUnits?.length || 0;
        } else if (prop.type === "project") {
          projectCount = 1;
          towerCount = prop.details?.totalTowers || prop.details?.towers?.length || 1;
          unitCount = prop.details?.totalUnits || prop.details?.generatedUnits?.length || 0;
        } else if (prop.type === "tower") {
          towerCount = 1;
          unitCount = prop.details?.totalUnits || prop.details?.generatedUnits?.length || 0;
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
