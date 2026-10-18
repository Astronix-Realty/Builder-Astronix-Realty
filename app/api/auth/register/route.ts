import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/services/authService";
import { IRegisterPayload } from "@/types/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/auth/register — Clean Controller Pattern
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = rateLimit(`register:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const payload: IRegisterPayload = await req.json();
    const result = await registerUser(payload);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Register error:", error.message);
    
    // Map common validation/conflict errors securely to HTTP status codes
    const message = error.message;
    if (message.includes("Email already registered") || message.includes("E11000") || message.includes("duplicate key")) {
      return NextResponse.json({ error: "Email already registered. Please login instead." }, { status: 409 });
    }
    if (message.includes("required") || message.includes("match") || message.includes("least") || message.includes("Invalid")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
