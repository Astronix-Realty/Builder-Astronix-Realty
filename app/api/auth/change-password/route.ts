import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import { getTokenFromRequest, verifyToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findById(decoded.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid current password" }, { status: 400 })
    }

    const salt = await bcrypt.genSalt(10)
    const newPasswordHash = await bcrypt.hash(newPassword, salt)

    user.passwordHash = newPasswordHash
    await user.save()

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("[POST /api/auth/change-password] error:", error)
    return NextResponse.json({ error: error.message || "Failed to change password" }, { status: 500 })
  }
}
