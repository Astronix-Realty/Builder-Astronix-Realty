import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { sendPasswordChangedEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: { $ne: true } })

    if (!user) {
      return NextResponse.json({ error: "Invalid OTP or email" }, { status: 400 })
    }

    // --- Verify OTP ---
    if (!user.passwordResetToken || user.passwordResetToken !== otp) {
      return NextResponse.json({ error: "Invalid OTP. Please check and try again." }, { status: 400 })
    }

    // --- Check Expiry ---
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
    }

    // --- Hash new password ---
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    // --- Update user ---
    user.passwordHash = passwordHash
    user.passwordResetToken = undefined
    user.passwordResetExpiry = undefined
    user.passwordResetRequestCount = 0
    user.passwordResetWindowStart = undefined
    user.lastPasswordResetSentAt = undefined
    // Clear any login lockout on successful reset
    user.loginAttempts = 0
    user.lockUntil = undefined
    await user.save()

    // --- Send confirmation email ---
    try {
      await sendPasswordChangedEmail(user.email)
    } catch (emailError) {
      // Don't fail the request if confirmation email fails
      console.error("Failed to send password change confirmation email:", emailError)
    }

    return NextResponse.json({ message: "Password reset successfully! You can now login with your new password." }, { status: 200 })
  } catch (error: any) {
    console.error("[POST /api/auth/reset-password] error:", error)
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 })
  }
}
