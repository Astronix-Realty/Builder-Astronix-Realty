import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import { sendForgotPasswordEmail } from "@/lib/email"

const RESET_MAX_PER_WINDOW = 3
const RESET_WINDOW_MS = 10 * 60 * 1000 // 10 minute window
const RESET_RESEND_COOLDOWN_MS = 60 * 1000 // 60 second cooldown

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: false })

    // Security: Always return success to prevent email enumeration
    const successResponse = NextResponse.json(
      { message: "If this email is registered, an OTP has been sent." },
      { status: 200 }
    )

    if (!user) return successResponse

    const now = new Date()

    // --- 60s cooldown ---
    if (user.lastPasswordResetSentAt) {
      const secondsSinceLast = now.getTime() - user.lastPasswordResetSentAt.getTime()
      if (secondsSinceLast < RESET_RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESET_RESEND_COOLDOWN_MS - secondsSinceLast) / 1000)
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting again.`, waitSeconds },
          { status: 429 }
        )
      }
    }

    // --- 3 per 10 min window ---
    const windowStart = user.passwordResetWindowStart || new Date(0)
    const windowExpired = (now.getTime() - windowStart.getTime()) > RESET_WINDOW_MS

    if (windowExpired) {
      user.passwordResetRequestCount = 0
      user.passwordResetWindowStart = now
    }

    if ((user.passwordResetRequestCount || 0) >= RESET_MAX_PER_WINDOW) {
      const windowResetAt = new Date(windowStart.getTime() + RESET_WINDOW_MS)
      const minutesLeft = Math.ceil((windowResetAt.getTime() - now.getTime()) / 60000)
      return NextResponse.json(
        { error: `Too many requests. Try again in ${minutesLeft} minute(s).`, minutesLeft },
        { status: 429 }
      )
    }

    // --- Generate OTP ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(now.getTime() + 15 * 60 * 1000) // 15 min expiry

    user.passwordResetToken = otp
    user.passwordResetExpiry = expiry
    user.passwordResetRequestCount = (user.passwordResetRequestCount || 0) + 1
    user.lastPasswordResetSentAt = now
    await user.save()

    // --- Send email ---
    await sendForgotPasswordEmail(user.email, otp)

    return successResponse
  } catch (error: any) {
    console.error("[POST /api/auth/forgot-password] error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
