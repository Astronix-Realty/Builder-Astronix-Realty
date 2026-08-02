import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import { getTokenFromRequest, verifyToken } from "@/lib/auth"
import { sendOtpEmail } from "@/lib/email"

const OTP_MAX_PER_WINDOW = 3         // Max 3 OTPs per window
const OTP_WINDOW_MS = 10 * 60 * 1000 // 10 minute window
const OTP_RESEND_COOLDOWN_MS = 60 * 1000 // 60 second cooldown between sends

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })

    await dbConnect()
    const user = await User.findById(decoded.userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const now = new Date()

    // --- Rate Limiting: 60s cooldown between requests ---
    if (user.lastOtpSentAt) {
      const secondsSinceLast = (now.getTime() - user.lastOtpSentAt.getTime())
      if (secondsSinceLast < OTP_RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - secondsSinceLast) / 1000)
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting another OTP.`, waitSeconds },
          { status: 429 }
        )
      }
    }

    // --- Rate Limiting: max 3 OTPs per 10 minutes ---
    const windowStart = user.otpWindowStart || new Date(0)
    const windowExpired = (now.getTime() - windowStart.getTime()) > OTP_WINDOW_MS

    if (windowExpired) {
      // Reset window
      user.otpRequestCount = 0
      user.otpWindowStart = now
    }

    if ((user.otpRequestCount || 0) >= OTP_MAX_PER_WINDOW) {
      const windowResetAt = new Date(windowStart.getTime() + OTP_WINDOW_MS)
      const minutesLeft = Math.ceil((windowResetAt.getTime() - now.getTime()) / 60000)
      return NextResponse.json(
        { error: `Too many OTP requests. Try again in ${minutesLeft} minute(s).`, minutesLeft },
        { status: 429 }
      )
    }

    // --- Generate & Save OTP ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(now.getTime() + 10 * 60 * 1000) // 10 min expiry

    user.otp = otp
    user.otpExpiry = otpExpiry
    user.otpRequestCount = (user.otpRequestCount || 0) + 1
    user.lastOtpSentAt = now
    await user.save()

    // --- Send Email ---
    await sendOtpEmail(user.email, otp)

    return NextResponse.json({ message: "OTP sent to your registered email successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("[POST /api/auth/send-otp] error:", error)
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 })
  }
}
