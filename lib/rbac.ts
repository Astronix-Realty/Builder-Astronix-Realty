import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export interface RBACContext {
  userId: string;
  role: 'builder' | 'mandate' | 'admin' | 'teamLeader';
  builderId?: string;
  mandateId?: string;
  email: string;
  propertyId?: string;
  propertyName?: string;
  builderAccountIds?: string[];
}

/**
 * Validates request authentication and checks role-based access.
 * Returns either authorized context or an error response.
 */
export async function checkRBAC(
  req: NextRequest,
  allowedRoles: ('builder' | 'mandate' | 'admin' | 'teamLeader')[]
): Promise<{ context?: RBACContext; errorResponse?: NextResponse }> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return { errorResponse: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return { errorResponse: NextResponse.json({ error: "Invalid token structure" }, { status: 401 }) };
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return { errorResponse: NextResponse.json({ error: "Invalid user ID in token payload" }, { status: 401 }) };
    }

    await dbConnect();

    // Query unified User model
    const user = await User.findOne({ _id: decoded.userId, isDeleted: false });
    if (!user) {
      return { errorResponse: NextResponse.json({ error: "User not found" }, { status: 404 }) };
    }

    // Account status check (suspended or pending approval)
    if (user.status === 'suspended') {
      return { errorResponse: NextResponse.json({ error: "Your account is suspended. Please contact administration." }, { status: 403 }) };
    }

    if (user.status === 'pending') {
      return { errorResponse: NextResponse.json({ error: "Your account activation is pending approval." }, { status: 403 }) };
    }

    // Role verification
    if (!allowedRoles.includes(user.role)) {
      return { errorResponse: NextResponse.json({ error: `Unauthorized. Role '${user.role}' is not allowed.` }, { status: 403 }) };
    }

    const context: RBACContext = {
      userId: user._id.toString(),
      role: user.role,
      builderId: user.builderId?.toString(),
      mandateId: user.mandateId?.toString(),
      email: user.email,
      propertyId: user.profile?.propertyId?.toString(),
      propertyName: user.profile?.propertyName?.toString(),
      builderAccountIds: []
    };

    if (user.role === 'teamLeader') {
      // Auto-heal stale or deleted propertyId if property was updated/republished
      if (user.profile?.propertyName) {
        try {
          const Property = (await import("@/models/Property")).default;
          let activeProp: any = null;
          if (context.propertyId && mongoose.Types.ObjectId.isValid(context.propertyId)) {
            activeProp = await Property.findOne({ _id: context.propertyId, isDeleted: { $ne: true } }).select("_id name").lean();
          }
          if (!activeProp) {
            activeProp = await Property.findOne({
              name: new RegExp(`^${user.profile.propertyName.trim()}$`, 'i'),
              isDeleted: { $ne: true },
              parentId: null
            }).sort({ updatedAt: -1 }).select("_id name").lean();

            if (activeProp) {
              const activeId = activeProp._id.toString();
              context.propertyId = activeId;
              context.propertyName = activeProp.name;
              User.updateOne(
                { _id: user._id },
                { $set: { "profile.propertyId": activeId, "profile.propertyName": activeProp.name } }
              ).exec().catch(() => {});
            }
          }
        } catch (healErr) {
          console.error("[RBAC TeamLeader Property Heal Error]:", healErr);
        }
      }

      const bIds = new Set<string>();
      if (user.builderId) bIds.add(user.builderId.toString());
      if (user.mandateId) bIds.add(user.mandateId.toString());

      // Also find builder or mandate user record to bridge IDs
      if (user.builderId) {
        const builderUser = await User.findOne({
          $or: [
            { _id: user.builderId },
            { builderId: user.builderId }
          ],
          isDeleted: { $ne: true }
        }).lean();
        if (builderUser) {
          bIds.add(builderUser._id.toString());
          if (builderUser.builderId) bIds.add(builderUser.builderId.toString());
        }
      }
      if (user.mandateId) {
        const mandateUser = await User.findOne({
          $or: [
            { _id: user.mandateId },
            { mandateId: user.mandateId }
          ],
          isDeleted: { $ne: true }
        }).lean();
        if (mandateUser) {
          bIds.add(mandateUser._id.toString());
          if (mandateUser.mandateId) bIds.add(mandateUser.mandateId.toString());
        }
      }
      context.builderAccountIds = Array.from(bIds);
    }

    return { context };
  } catch (error: any) {
    console.error("[RBAC Guard Error]:", error);
    
    // Identify database connection errors (network drops, MongoServerSelectionError, DNS timeouts)
    const isDbError = error.name?.includes("Mongo") || error.message?.includes("getaddrinfo") || error.message?.includes("connection") || error.message?.includes("Mongoose");
    const errorMsg = isDbError 
      ? "Database connection failed. Please check your internet connection or MongoDB Atlas status." 
      : "Internal Server Error during authorization";
      
    return { 
      errorResponse: NextResponse.json(
        { 
          error: errorMsg,
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        }, 
        { status: isDbError ? 503 : 500 } 
      ) 
    };
  }
}

export function getOwnershipQuery(context: RBACContext): Record<string, any> {
  const idStrings = [context.builderId, context.userId, context.mandateId].filter(Boolean) as string[];
  const objectIds = idStrings
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));
  const allIds = [...idStrings, ...objectIds];

  if (allIds.length === 0) return { _id: null };

  if (context.role === 'builder') {
    return {
      role: { $ne: 'mandate' },
      $or: [
        { builderId: { $in: allIds } },
        { accountId: { $in: allIds } },
        { createdBy: { $in: allIds } },
        { 'assignedBuilder.id': { $in: allIds } },
        { 'assignedBuilder._id': { $in: allIds } }
      ]
    };
  } else if (context.role === 'teamLeader') {
    const builderIds = context.builderAccountIds && context.builderAccountIds.length > 0
      ? context.builderAccountIds
      : [context.builderId, context.userId].filter(Boolean) as string[];

    const bObjectIds = builderIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    const allBuilderIds = [...builderIds, ...bObjectIds];

    const propConditions: any[] = [];
    if (context.propertyId) {
      const pId = context.propertyId;
      if (mongoose.Types.ObjectId.isValid(pId)) {
        propConditions.push({ projectId: new mongoose.Types.ObjectId(pId) });
      }
      propConditions.push(
        { projectId: pId },
        { 'hierarchyContext.propertyId': pId },
        { 'hierarchyContext.projectId': pId },
        { 'hierarchyContext.townshipId': pId },
        { 'hierarchyContext.towerId': pId },
        { poolRootPropertyId: pId }
      );
      if (context.propertyName) {
        propConditions.push(
          { 'hierarchyContext.propertyTitle': context.propertyName },
          { 'hierarchyContext.topPropertyName': context.propertyName },
          { poolRootPropertyName: context.propertyName }
        );
      }
    }

    if (propConditions.length > 0) {
      return {
        $and: [
          {
            $or: [
              { builderId: { $in: allBuilderIds } },
              { accountId: { $in: allBuilderIds } },
              { mandateId: { $in: allBuilderIds } },
              { createdBy: { $in: allBuilderIds } },
              { 'assignedBuilder.id': { $in: allBuilderIds } },
              { 'assignedBuilder._id': { $in: allBuilderIds } }
            ]
          },
          { $or: propConditions }
        ]
      };
    }

    return {
      $or: [
        { builderId: { $in: allBuilderIds } },
        { accountId: { $in: allBuilderIds } },
        { mandateId: { $in: allBuilderIds } },
        { createdBy: { $in: allBuilderIds } },
        { 'assignedBuilder.id': { $in: allBuilderIds } },
        { 'assignedBuilder._id': { $in: allBuilderIds } }
      ]
    };
  } else if (context.role === 'mandate') {
    return {
      $or: [
        { mandateId: { $in: allIds } },
        { accountId: { $in: allIds } },
        { builderId: { $in: allIds } },
        { createdBy: { $in: allIds } }
      ]
    };
  }
  return {};
}
