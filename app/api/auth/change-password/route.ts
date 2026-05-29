import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import { getTokenFromRequest, verifyToken } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { sendPasswordChangedEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })

    const { otp, newPassword } = await req.json()

    if (!otp || !newPassword) {
      return NextResponse.json({ error: "OTP and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findById(decoded.userId)

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // --- Verify OTP ---
    if (!user.otp || user.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP. Please check and try again." }, { status: 400 })
    }

    // --- Check Expiry ---
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
    }

    // --- Hash new password ---
    const salt = await bcrypt.genSalt(10)
    const newPasswordHash = await bcrypt.hash(newPassword, salt)

    // --- Update user ---
    user.passwordHash = newPasswordHash
    user.otp = undefined
    user.otpExpiry = undefined
    user.otpRequestCount = 0
    user.otpWindowStart = undefined
    user.lastOtpSentAt = undefined
    await user.save()

    // --- Send confirmation email ---
    try {
      await sendPasswordChangedEmail(user.email)
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError)
    }

    return NextResponse.json({ message: "Password updated successfully!" }, { status: 200 })
  } catch (error: any) {
    console.error("[POST /api/auth/change-password] error:", error)
    return NextResponse.json({ error: error.message || "Failed to change password" }, { status: 500 })
  }
}
