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

    return {
      context: {
        userId: user._id.toString(),
        role: user.role,
        builderId: user.builderId?.toString(),
        mandateId: user.mandateId?.toString(),
        email: user.email
      }
    };
  } catch (error: any) {
    console.error("[RBAC Guard Error]:", error);
    try {
      require("fs").writeFileSync("rbac-error.log", error.stack || error.message || String(error));
    } catch(e) {}
    
    // Identify database connection errors (network drops, MongoServerSelectionError, DNS timeouts)
    const isDbError = error.name?.includes("Mongo") || error.message?.includes("getaddrinfo") || error.message?.includes("connection") || error.message?.includes("Mongoose");
    const errorMsg = isDbError 
      ? "Database connection failed. Please check your internet connection or MongoDB Atlas status." 
      : "Internal Server Error during authorization";
      
    return { 
      errorResponse: NextResponse.json(
        { error: errorMsg, details: error.message, stack: error.stack }, 
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
        { createdBy: { $in: allIds } }
      ]
    };
  } else if (context.role === 'teamLeader') {
    return {
      $or: [
        { builderId: { $in: allIds } },
        { accountId: { $in: allIds } }
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
