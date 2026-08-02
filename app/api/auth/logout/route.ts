import { NextResponse } from "next/server"
import { AUTH_COOKIE } from "@/lib/auth"

// POST /api/auth/logout — Clear session cookie
export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
  return response
}
