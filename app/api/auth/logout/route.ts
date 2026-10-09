import { NextRequest, NextResponse } from "next/server";
import { authService } from "../../../../services/auth.service";
import { connectDB } from "../../../../config/db";
import { ResponseHelper } from "../../../../helpers/response";
import { verifyAuth } from "../../../../middleware/auth.middleware";
import { apiHandler } from "../../../../utils/api-handler";
import { MESSAGES } from "../../../../constants/messages";
import { ActivityLog } from "../../../../models/activity-log.model";

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const user = verifyAuth(req);

  if (user) {
    try {
      await authService.logout(user.userId, user.sessionId);
      await ActivityLog.create({
        user: user.userId,
        role: user.role,
        action: "Logout",
        entity: "Session",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      });
    } catch {
      // Continue cleanup
    }
  }

  const response = NextResponse.json(
    ResponseHelper.success(MESSAGES.AUTH.LOGOUT_SUCCESS),
    { status: 200 }
  );

  response.cookies.delete({ name: "refreshToken", path: "/api/auth/refresh" });
  response.cookies.delete({ name: "accessToken", path: "/" });
  response.cookies.set("accessToken", "", { path: "/", expires: new Date(0) });
  response.cookies.set("refreshToken", "", { path: "/api/auth/refresh", expires: new Date(0) });

  return response;
});

export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const user = verifyAuth(req);

  if (user) {
    try {
      await authService.logout(user.userId, user.sessionId);
      await ActivityLog.create({
        user: user.userId,
        role: user.role,
        action: "Logout",
        entity: "Session",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      });
    } catch {
      // Continue cleanup
    }
  }

  // Derive canonical external base URL to prevent leaking internal proxy port (e.g., :3080)
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || (forwardedHost?.includes("localhost") ? "http" : "https");

  let redirectTarget: URL;
  if (process.env.NEXT_PUBLIC_APP_URL) {
    redirectTarget = new URL("/login", process.env.NEXT_PUBLIC_APP_URL);
  } else if (forwardedHost) {
    redirectTarget = new URL("/login", `${forwardedProto}://${forwardedHost}`);
  } else {
    redirectTarget = new URL("/login", req.nextUrl.origin);
  }

  const response = NextResponse.redirect(redirectTarget);

  response.cookies.delete({ name: "refreshToken", path: "/api/auth/refresh" });
  response.cookies.delete({ name: "accessToken", path: "/" });
  response.cookies.set("accessToken", "", { path: "/", expires: new Date(0) });
  response.cookies.set("refreshToken", "", { path: "/api/auth/refresh", expires: new Date(0) });

  return response;
});
