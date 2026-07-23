import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import Builder from "@/models/Builder"
import Mandate from "@/models/Mandate"
import { getTokenFromRequest, verifyToken, signToken, AUTH_COOKIE, TOKEN_MAX_AGE } from "@/lib/auth"

export const dynamic = "force-dynamic";

// GET /api/auth/me — Return current logged-in user and refresh JWT cookie if approval status changed
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    await dbConnect()
    
    // Unified User model
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = user.toObject()
    delete (userData as any).passwordHash

    // Fetch role-specific profile data if linked
    if (user.role === 'builder' && user.builderId) {
      const builderProfile = await Builder.findById(user.builderId);
      if (builderProfile) {
        userData.profile = { ...userData.profile, ...builderProfile.toObject() };
        delete (userData as any).profile.password; // Security
      }
    } else if (user.role === 'mandate' && user.mandateId) {
      const mandateProfile = await Mandate.findById(user.mandateId);
      if (mandateProfile) {
        userData.profile = { ...userData.profile, ...mandateProfile.toObject() };
        delete (userData as any).profile.password; // Security
      }
    }

    const currentApprovalStatus = user.approvalStatus || 'pending';
    const response = NextResponse.json({ user: userData }, { status: 200 });

    // Critical Fix: If approvalStatus in DB changed vs token, re-sign token & update cookie
    if (currentApprovalStatus !== decoded.approvalStatus || user.approvalMessage !== decoded.approvalMessage) {
      const newToken = signToken({
        userId: user._id.toString(),
        email: user.email,
        userType: user.role,
        approvalStatus: currentApprovalStatus,
        approvalMessage: user.approvalMessage || '',
      });

      response.cookies.set(AUTH_COOKIE, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: TOKEN_MAX_AGE,
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 })
  }
}
