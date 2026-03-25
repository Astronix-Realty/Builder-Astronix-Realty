import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/services/authService";
import { ILoginPayload } from "@/types/auth";
import { AUTH_COOKIE, TOKEN_MAX_AGE } from "@/lib/auth";

// POST /api/auth/login — Clean Controller Pattern
export async function POST(req: NextRequest) {
  try {
    const payload: ILoginPayload = await req.json();
    const { token, user, message } = await authenticateUser(payload);

    // Set HttpOnly cookie securely and return user data
    const response = NextResponse.json({ message, user }, { status: 200 });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TOKEN_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error.message);
    
    const msg = error.message;
    if (msg.includes("Invalid")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg.includes("required")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
