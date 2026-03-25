import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/services/authService";
import { IRegisterPayload } from "@/types/auth";

// POST /api/auth/register — Clean Controller Pattern
export async function POST(req: NextRequest) {
  try {
    const payload: IRegisterPayload = await req.json();
    const result = await registerUser(payload);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Register error:", error.message);
    
    // Map common validation/conflict errors securely to HTTP status codes
    const message = error.message;
    if (message.includes("Email already registered")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.includes("required") || message.includes("match") || message.includes("least") || message.includes("Invalid")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
