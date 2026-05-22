import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "astronix-realty-secret-key-change-in-production"
export const AUTH_COOKIE = "auth_token"
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function signToken(payload: { userId: string; email: string; userType: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; userType: string }
  } catch {
    return null
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

