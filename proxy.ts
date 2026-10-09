import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { JwtHelper } from "./helpers/jwt";

/**
 * Route Protection Proxy (Next.js 16)
 *
 * Protected prefixes require a valid `accessToken` cookie or Bearer header.
 * Unauthenticated UI requests are redirected to /login.
 * Unauthenticated API requests return 401.
 */
const PROTECTED_PREFIXES = ["/admin", "/student", "/teacher", "/dashboard", "/api/protected"];
const PUBLIC_API_PREFIXES = ["/api/public", "/api/v1/public"];

function getAllowedOrigins(): string[] {
  const configured = process.env.PUBLIC_WEB_ORIGINS;
  if (configured) {
    return configured
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean);
  }
  return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  return getAllowedOrigins().includes(cleanOrigin);
}

function applyPublicCorsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && isAllowedOrigin(origin)) {
    const cleanOrigin = origin.trim().replace(/\/+$/, "");
    res.headers.set("Access-Control-Allow-Origin", cleanOrigin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    );
    res.headers.set("Access-Control-Max-Age", "86400");
  }
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  // Handle CORS OPTIONS Preflight for Public API routes
  if (request.method === "OPTIONS" && isPublicApi) {
    const origin = request.headers.get("origin");
    if (origin && isAllowedOrigin(origin)) {
      const cleanOrigin = origin.trim().replace(/\/+$/, "");
      const headers = new Headers();
      headers.set("Access-Control-Allow-Origin", cleanOrigin);
      headers.set("Vary", "Origin");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin"
      );
      headers.set("Access-Control-Max-Age", "86400");
      return new NextResponse(null, { status: 204, headers });
    }
    return new NextResponse(null, { status: 204 });
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      token = request.cookies.get("accessToken")?.value || null;
    }

    if (!token) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { success: false, message: "Not authenticated", code: "AUTH_TOKEN_INVALID" },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const decoded = await JwtHelper.verifyAccessEdge(token);
    if (!decoded) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { success: false, message: "Invalid token", code: "AUTH_TOKEN_EXPIRED" },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  if (isPublicApi) {
    return applyPublicCorsHeaders(request, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
