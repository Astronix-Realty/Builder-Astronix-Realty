import { NextRequest, NextResponse } from "next/server";
const AUTH_COOKIE = "auth_token";

// Edge-compatible JWT verifier using Web Crypto API
async function verifyJwtEdge(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[Builder Middleware Critical]: JWT_SECRET is not configured.");
      return null;
    }
    
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

  // Protect team panel
  // Protect /panel routes (e.g. Ads Studio & builder tools)
  if (pathname.startsWith("/panel")) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const payload = await verifyJwtEdge(token);
    if (!payload) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "session_expired");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/team-panel")) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("type", "teamLeader");
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJwtEdge(token);
    if (!payload) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "session_expired");
      return NextResponse.redirect(loginUrl);
    }

    const isTeamLeader = payload.userType === "teamLeader" || payload.role === "teamLeader";
    if (!isTeamLeader) {
      const isBuilder = payload.userType === "builder" || payload.role === "builder";
      return NextResponse.redirect(new URL(isBuilder ? "/builder-dashboard" : "/mandate-dashboard", req.url));
    }

    return NextResponse.next();
  }

  // Protect dashboard and builder flows
  if (pathname.startsWith("/builder") || pathname.startsWith("/mandate-dashboard")) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;

    // 1. Not logged in -> redirect to /login
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Verify JWT at the Edge
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
    const isTeamLeader = payload.userType === "teamLeader" || payload.role === "teamLeader";

    // Team leaders can't access builder/mandate areas
    if (isTeamLeader) {
      return NextResponse.redirect(new URL("/team-panel", req.url));
    }

    if (!isBuilder && !isMandate) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // 5. Approval Status Check — Lock unapproved users to profile-settings only
    const approvalStatus = payload.approvalStatus || 'pending';
    const allowedPendingPaths = [
      '/builder-dashboard/profile-settings',
      '/mandate-dashboard/profile-settings',
      '/builder-dashboard/approval-status',
      '/mandate-dashboard/approval-status',
    ];
    const isAllowedPendingPath = allowedPendingPaths.some(p => pathname.startsWith(p));

    if (approvalStatus !== 'approved' && !isAllowedPendingPath) {
      // Redirect to profile-settings with approval status info
      const dashPrefix = isBuilder ? '/builder-dashboard' : '/mandate-dashboard';
      const redirectUrl = new URL(`${dashPrefix}/profile-settings`, req.url);
      redirectUrl.searchParams.set('approval', approvalStatus);
      if (approvalStatus === 'rejected' && payload.approvalMessage) {
        redirectUrl.searchParams.set('message', payload.approvalMessage);
      }
      return NextResponse.redirect(redirectUrl);
    }

    // 6. Cross-Role Isolation logic
    if (pathname.startsWith("/builder-dashboard") && !isBuilder) {
      return NextResponse.redirect(new URL("/mandate-dashboard", req.url));
    }

    if (pathname.startsWith("/mandate-dashboard") && !isMandate) {
      return NextResponse.redirect(new URL("/builder-dashboard", req.url));
    }

    // Passes all checks!
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  // Prevent authenticated users from visiting the login page
  if (pathname === "/login") {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (token) {
      const payload = await verifyJwtEdge(token);
      if (payload) {
        const isBuilder = payload.userType === "builder" || payload.role === "builder";
        const isTeamLeader = payload.userType === "teamLeader" || payload.role === "teamLeader";
        if (isTeamLeader) return NextResponse.redirect(new URL("/team-panel", req.url));
        return NextResponse.redirect(new URL(isBuilder ? "/builder-dashboard" : "/mandate-dashboard", req.url));
      }
    }
    // Allow public access to login without noindex header
    return NextResponse.next();
  }

  const response = NextResponse.next();
  // Apply noindex only to protected routes matching middleware
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}

export const config = {
  matcher: ['/builder/:path*', '/builder-dashboard/:path*', '/mandate-dashboard/:path*', '/team-panel/:path*', '/panel/:path*', '/login'],
};
