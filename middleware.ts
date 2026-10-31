import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "auth_token";
const DEFAULT_JWT_SECRET = "!99f9aK2!lPq91@xZ!mN8vR5$uT3cH6bW0eY";

// Robust cookie extraction supporting direct cookie, bearer header, and trimmed quotes
function getAuthToken(req: NextRequest): string | undefined {
  let token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  if (token) {
    token = token.trim();
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
  }
  return token || undefined;
}

// Edge-compatible JWT verifier using jose (RFC 7519 compliant)
async function verifyJwtEdge(token: string) {
  try {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    return payload as Record<string, any>;
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Builder Middleware]: JWT verification failed at Edge:", error?.message);
    }
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /panel routes (e.g. Ads Studio & builder tools)
  if (pathname.startsWith("/panel")) {
    const token = getAuthToken(req);
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

  // Protect team panel
  if (pathname.startsWith("/team-panel")) {
    const token = getAuthToken(req);

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
    const token = getAuthToken(req);

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
    const token = getAuthToken(req);
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
