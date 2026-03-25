import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import { getTokenFromRequest, verifyToken } from "@/lib/auth"

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
    delete userData.passwordHash

    return NextResponse.json({ user: userData }, { status: 200 })
  } catch (error: any) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 })
  }
}

