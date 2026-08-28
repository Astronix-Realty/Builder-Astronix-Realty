import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// GET /api/group-buying/pools — List group buying pools for builder / mandate
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ['builder', 'mandate']);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const ownership = getOwnershipQuery(context!);
    const query = {
      isGroup: true,
      isArchived: { $ne: true },
      ...ownership
    };

    const pools = await Lead.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    const formattedPools = pools.map((p: any) => {
      const members = Array.isArray(p.mergedMembers) ? p.mergedMembers : [];
      return {
        id: p._id.toString(),
        _id: p._id.toString(),
        name: p.name,
        groupPoolKey: p.groupPoolKey,
        poolRootLevel: p.poolRootLevel || "Project",
        poolRootPropertyId: p.poolRootPropertyId,
        poolRootPropertyName: p.poolRootPropertyName || p.topPropertyName || p.name,
        groupSize: Math.max(members.length, p.groupSize || 1),
        groupDiscount: p.groupDiscount || "Bulk Discount",
        status: p.status || "Fresh",
        totalMembers: members.length,
        members: members,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      pools: formattedPools,
      count: formattedPools.length
    });
  } catch (error: any) {
    console.error("Builder GET /api/group-buying/pools error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
