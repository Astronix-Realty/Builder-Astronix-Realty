import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import Builder from "@/models/Builder"
import Mandate from "@/models/Mandate"
import { getTokenFromRequest, verifyToken } from "@/lib/auth"

export const dynamic = "force-dynamic";

// GET /api/auth/me — Return current logged-in user
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

    return NextResponse.json({ user: userData }, { status: 200 })
  } catch (error: any) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 })
  }
}


// triggered hot reload
