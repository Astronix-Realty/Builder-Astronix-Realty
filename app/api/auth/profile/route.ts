import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import Builder from "@/models/Builder"
import Mandate from "@/models/Mandate"
import { getTokenFromRequest, verifyToken } from "@/lib/auth"

// PUT /api/auth/profile — Update current user's profile data
export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const body = await req.json()

    // Whitelist allowed profile fields
    const allowedFields = [
      "companyName", "developerName", "fullName", "phone", "address",
      "description", "reraNumber", "website", "logo",
      "city", "state", "experience", "panNumber", "aadharNumber",
      "specialization", "preferredAreas"
    ]

    const profileUpdate: Record<string, any> = {}
    const roleSpecificUpdate: Record<string, any> = {}

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        profileUpdate[`profile.${key}`] = body[key]
        roleSpecificUpdate[key] = body[key]
      }
    }

    if (Object.keys(profileUpdate).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    await dbConnect()

    // Update User model (fallback/sync)
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: profileUpdate },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update Role-Specific model
    if (updatedUser.role === 'builder' && updatedUser.builderId) {
      await Builder.findByIdAndUpdate(updatedUser.builderId, { $set: roleSpecificUpdate });
    } else if (updatedUser.role === 'mandate' && updatedUser.mandateId) {
      await Mandate.findByIdAndUpdate(updatedUser.mandateId, { $set: roleSpecificUpdate });
    }

    // Refetch the merged user data
    const finalUserRes = await fetch(`${req.nextUrl.origin}/api/auth/me`, {
      headers: { Cookie: `${req.headers.get("cookie")}` }
    });
    const finalUserData = await finalUserRes.json();

    return NextResponse.json({ user: finalUserData.user, message: "Profile updated successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("[PUT /api/auth/profile] error:", error)
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 })
  }
}
