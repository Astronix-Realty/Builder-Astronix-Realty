import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
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

    // Whitelist allowed profile fields to prevent injection
    const allowedFields = [
      "companyName", "developerName", "phone", "address",
      "description", "reraNumber", "website", "logo",
      "city", "state", "experience"
    ]

    const profileUpdate: Record<string, any> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        profileUpdate[`profile.${key}`] = body[key]
      }
    }

    if (Object.keys(profileUpdate).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    await dbConnect()

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: profileUpdate },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = updatedUser.toObject()
    delete userData.passwordHash

    return NextResponse.json({ user: userData, message: "Profile updated successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("[PUT /api/auth/profile] error:", error)
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 })
  }
}
