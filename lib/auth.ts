import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

export const AUTH_COOKIE = "auth_token"
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "!99f9aK2!lPq91@xZ!mN8vR5$uT3cH6bW0eY";
}

export function signToken(payload: { 
  userId: string; 
  email: string; 
  userType: string;
  approvalStatus?: string;
  approvalMessage?: string;
}) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret) as { 
      userId: string; 
      email: string; 
      userType: string;
      approvalStatus?: string;
      approvalMessage?: string;
    };
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[verifyToken Error]:", err?.message);
    }
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const cookieVal = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookieVal) return cookieVal;

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

