/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./api-error";
import { ApiResponse } from "./api-response";
import { logger } from "./logger";
import jwt from "jsonwebtoken";
import { UserPayload } from "../types";

export const apiHandler = (
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) => {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const method = req.method;
    const endpoint = req.nextUrl.pathname;
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Attempt to decode user info for logging (non-blocking)
    let userId = "anonymous";
    let role = "anonymous";
    try {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.cookies.get("accessToken")?.value;

      if (token) {
        const decoded = jwt.decode(token) as UserPayload;
        if (decoded) {
          userId = decoded.userId || "anonymous";
          role = decoded.role || "anonymous";
        }
      }
    } catch {
      // Ignore decode errors for logging
    }

    try {
      const response = await handler(req, ...args);
      const executionTime = Date.now() - start;
      
      logger.info({
        requestId,
        userId,
        role,
        method,
        endpoint,
        statusCode: response.status,
        executionTime: `${executionTime}ms`,
        ip,
        userAgent,
      }, "Request Completed");

      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error: any) {
      const executionTime = Date.now() - start;
      let statusCode = 500;
      let code = "INTERNAL_SERVER_ERROR";
      let message = "Internal server error";
      let details: any = null;

      if (error instanceof ApiError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        details = error.details;
      } else {
        message = "Internal server error";
      }

      logger.error({
        requestId,
        userId,
        role,
        method,
        endpoint,
        statusCode,
        executionTime: `${executionTime}ms`,
        ip,
        userAgent,
        code,
        message,
        details,
        stack: error instanceof Error && process.env.NODE_ENV !== "production" ? error.stack : undefined,
      }, "Request Failed");

      const response = NextResponse.json(
        ApiResponse.error(message, code, details),
        { status: statusCode }
      );
      response.headers.set("x-request-id", requestId);

      if (endpoint.startsWith("/api/public") || endpoint.startsWith("/api/v1/public")) {
        const origin = req.headers.get("origin");
        if (origin) {
          const cleanOrigin = origin.trim().replace(/\/+$/, "");
          const allowed = (process.env.PUBLIC_WEB_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
            .split(",")
            .map((o) => o.trim().replace(/\/+$/, ""));
          if (allowed.includes(cleanOrigin)) {
            response.headers.set("Access-Control-Allow-Origin", cleanOrigin);
            response.headers.set("Vary", "Origin");
            response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.headers.set(
              "Access-Control-Allow-Headers",
              "Content-Type, Authorization, X-Requested-With, Accept, Origin"
            );
          }
        }
      }

      return response;
    }
  };
};
