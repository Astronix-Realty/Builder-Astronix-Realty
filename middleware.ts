import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

// Edge-compatible JWT verifier using Web Crypto API
async function verifyJwtEdge(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    
    const secret = process.env.JWT_SECRET || "astronix-realty-secret-key-change-in-production";
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert base64url to Uint8Array safely for Edge Runtime
    const atobSafe = (str: string) => atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    const signatureBytes = Uint8Array.from(atobSafe(signatureB64), c => c.charCodeAt(0));
    const dataBytes = encoder.encode(`${headerB64}.${payloadB64}`);

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, dataBytes);
    
    if (!isValid) return null;

    const payload = JSON.parse(atobSafe(payloadB64));
    return payload;
  } catch (error) {
    console.error("JWT verification failed at Edge:", error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect dashboard and builder flows
  if (pathname.startsWith("/builder") || pathname.startsWith("/mandate-dashboard")) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;

    // 1. Not logged in -> redirect to /login
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Verify JWT at the Edge (ensures token hasn't been tampered with)
    const payload = await verifyJwtEdge(token);

    // 3. Token invalid or expired -> redirect to /login
    if (!payload) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "session_expired");
      return NextResponse.redirect(loginUrl);
    }

    // 4. Determine Roles
    const isBuilder = payload.userType === "builder" || payload.role === "builder";
    const isMandate = payload.userType === "mandate" || payload.role === "mandate";

    if (!isBuilder && !isMandate) {
      // Redirect to a safe fallback (homepage or dashboard depending on setup)
      return NextResponse.redirect(new URL("/", req.url)); 
    }

    // 5. Cross-Role Isolation logic
    if (pathname.startsWith("/builder-dashboard") && !isBuilder) {
      return NextResponse.redirect(new URL("/mandate-dashboard", req.url));
    }

    if (pathname.startsWith("/mandate-dashboard") && !isMandate) {
      return NextResponse.redirect(new URL("/builder-dashboard", req.url));
    }

    // Passes all checks!
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/builder/:path*', '/builder-dashboard/:path*', '/mandate-dashboard/:path*'],
};
