import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import Unit from "@/models/Unit";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * GET /api/debug-units?propertyId=xxx
 * Returns raw diagnostic data for a root property:
 * - All child properties (projects, towers)
 * - All Unit documents found via towerIds
 * - Unit documents found without ownership filter (admin diagnostic)
 * Only works in non-production for safety.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      // Return all units for this user
      const ownershipQuery = getOwnershipQuery(context!);
      const units = await Unit.find(ownershipQuery).limit(50).lean();
      const properties = await Property.find({ ...ownershipQuery, parentId: null, isDeleted: false }).lean();
      return NextResponse.json({
        context: { role: context!.role, userId: context!.userId, mandateId: context!.mandateId },
        rootProperties: properties.map((p: any) => ({ _id: p._id, name: p.name, type: p.type, status: p.status, role: p.role, builderId: p.builderId, mandateId: p.mandateId })),
        units: units.map((u: any) => ({ _id: u._id, towerId: u.towerId, status: u.status, role: u.role, builderId: u.builderId, accountId: u.accountId, mandateId: u.mandateId, unitNumber: u.unitNumber })),
        totalUnits: await Unit.countDocuments(ownershipQuery),
      });
    }

    // Specific property diagnostic
    const prop = await Property.findById(propertyId).lean() as any;
    if (!prop) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    // Collect all descendant property IDs
    const allPropIds: string[] = [prop._id.toString()];
    const children = await Property.find({ parentId: prop._id, isDeleted: false }).lean() as any[];
    for (const child of children) {
      allPropIds.push(child._id.toString());
      const grandchildren = await Property.find({ parentId: child._id, isDeleted: false }).lean() as any[];
      grandchildren.forEach((gc: any) => allPropIds.push(gc._id.toString()));
    }

    // All units for these property IDs (no ownership filter for diagnostics)
    const allUnitsRaw = await Unit.find({
      $or: [
        { towerId: { $in: allPropIds } },
        { projectId: { $in: allPropIds } },
        { parentId: { $in: allPropIds } },
      ]
    }).lean();

    // Units with ownership filter
    const ownershipQuery = getOwnershipQuery(context!);
    const ownedUnits = await Unit.find({
      ...ownershipQuery,
      $or: [
        { towerId: { $in: allPropIds } },
        { projectId: { $in: allPropIds } },
      ]
    }).lean();

    return NextResponse.json({
      context: { role: context!.role, userId: context!.userId, mandateId: context!.mandateId },
      property: { _id: prop._id, name: prop.name, type: prop.type, status: prop.status, role: prop.role, builderId: prop.builderId },
      allDescendantPropertyIds: allPropIds,
      childProperties: children.map((c: any) => ({ _id: c._id, name: c.name, type: c.type, status: c.status, parentId: c.parentId })),
      allUnitsRaw: allUnitsRaw.map((u: any) => ({
        _id: u._id, towerId: u.towerId, projectId: u.projectId,
        status: u.status, role: u.role, builderId: u.builderId,
        accountId: u.accountId, mandateId: u.mandateId, unitNumber: u.unitNumber,
        hasInDetails: false,
      })),
      ownedUnits: ownedUnits.map((u: any) => ({
        _id: u._id, towerId: u.towerId, status: u.status, unitNumber: u.unitNumber
      })),
      summary: {
        totalRawUnits: allUnitsRaw.length,
        ownedUnits: ownedUnits.length,
        embeddedUnitCount: prop.details?.generatedUnits?.length || 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
