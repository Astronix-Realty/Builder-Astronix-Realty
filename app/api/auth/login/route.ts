import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/services/authService";
import { ILoginPayload } from "@/types/auth";
import { AUTH_COOKIE, TOKEN_MAX_AGE } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/auth/login — Clean Controller Pattern
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Rate limiting: max 10 attempts per minute per IP
    const { allowed } = rateLimit(`login:${clientIp}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts from this network. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const payload: ILoginPayload = await req.json();

    const { token, user, message } = await authenticateUser(payload, clientIp);

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
    if (msg.includes("locked") || msg.includes("suspended")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    if (msg.includes("Invalid") || msg.includes("attempt")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg.includes("required")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
