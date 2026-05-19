import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export interface RBACContext {
  userId: string;
  role: 'builder' | 'mandate' | 'admin';
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
  allowedRoles: ('builder' | 'mandate' | 'admin')[]
): Promise<{ context?: RBACContext; errorResponse?: NextResponse }> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return { errorResponse: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return { errorResponse: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
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
    return { errorResponse: NextResponse.json({ error: "Internal Server Error during authorization" }, { status: 500 }) };
  }
}

export function getOwnershipQuery(context: RBACContext): Record<string, any> {
  if (context.role === 'builder') {
    const conditions: any[] = [];
    if (context.userId) {
      conditions.push({ builderId: context.userId });
      conditions.push({ accountId: context.userId });
    }
    return {
      role: { $ne: 'mandate' },
      ...(conditions.length > 0 ? { $or: conditions } : { _id: null })
    };
  } else if (context.role === 'mandate') {
    const conditions: any[] = [];
    if (context.userId) {
      conditions.push({ accountId: context.userId });
    }
    if (context.mandateId) {
      conditions.push({ mandateId: context.mandateId });
      conditions.push({ mandateId: context.userId });
    }
    return {
      role: 'mandate',
      ...(conditions.length > 0 ? { $or: conditions } : { _id: null })
    };
  }
  return {};
}
