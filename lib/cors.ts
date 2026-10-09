import { NextRequest, NextResponse } from "next/server";

/**
 * Returns allowed public web origins based on environment configuration.
 * In Development: defaults to http://localhost:5173 and http://127.0.0.1:5173.
 * In Production: reads explicit comma-separated origins from process.env.PUBLIC_WEB_ORIGINS.
 */
export function getAllowedOrigins(): string[] {
  const configured = process.env.PUBLIC_WEB_ORIGINS;
  if (configured) {
    return configured
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean);
  }

  if (process.env.NODE_ENV !== "production") {
    return ["http://localhost:5173", "http://127.0.0.1:5173"];
  }

  return [];
}

/**
 * Checks if a given request origin matches the allowed public web origins.
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  const allowed = getAllowedOrigins();
  return allowed.includes(cleanOrigin);
}

/**
 * Applies strict CORS headers to an outgoing NextResponse if the request origin is allowed.
 * Used on public API routes (e.g. /api/public/lead).
 */
export function applyCorsHeaders(
  request: NextRequest | Request,
  response: NextResponse,
  options?: {
    methods?: string[];
    allowedHeaders?: string[];
    maxAge?: number;
  }
): NextResponse {
  const origin = request.headers.get("origin");

  if (origin && isAllowedOrigin(origin)) {
    const cleanOrigin = origin.trim().replace(/\/+$/, "");
    response.headers.set("Access-Control-Allow-Origin", cleanOrigin);
    response.headers.set("Vary", "Origin");

    const methods = options?.methods || ["POST", "GET", "OPTIONS"];
    response.headers.set("Access-Control-Allow-Methods", methods.join(", "));

    const headers = options?.allowedHeaders || [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ];
    response.headers.set("Access-Control-Allow-Headers", headers.join(", "));
    response.headers.set("Access-Control-Max-Age", String(options?.maxAge || 86400));
  }

  return response;
}

/**
 * Handles OPTIONS preflight requests for public API routes.
 */
export function handleCorsPreflight(
  request: NextRequest | Request,
  options?: {
    methods?: string[];
    allowedHeaders?: string[];
    maxAge?: number;
  }
): NextResponse {
  const origin = request.headers.get("origin");

  if (origin && isAllowedOrigin(origin)) {
    const cleanOrigin = origin.trim().replace(/\/+$/, "");
    const headers = new Headers();

    headers.set("Access-Control-Allow-Origin", cleanOrigin);
    headers.set("Vary", "Origin");

    const methods = options?.methods || ["POST", "GET", "OPTIONS"];
    headers.set("Access-Control-Allow-Methods", methods.join(", "));

    const allowedHeaders = options?.allowedHeaders || [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ];
    headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));
    headers.set("Access-Control-Max-Age", String(options?.maxAge || 86400));

    return new NextResponse(null, { status: 204, headers });
  }

  return new NextResponse(null, { status: 204 });
}
