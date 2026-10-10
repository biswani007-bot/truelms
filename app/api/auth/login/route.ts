
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Auto-generated summary for POST /api/auth/login
 *     tags: [auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
import { NextRequest, NextResponse } from "next/server";
import { authService } from "../../../../services/auth.service";
import { connectDB } from "../../../../config/db";
import { ResponseHelper } from "../../../../helpers/response";
import { ValidationHelper } from "../../../../helpers/validation";
import { LoginSchema } from "../../../../dtos/auth/login.dto";
import { apiHandler } from "../../../../utils/api-handler";
import { MESSAGES } from "../../../../constants/messages";
import { ActivityLog } from "../../../../models/activity-log.model";

import { UAParser } from "ua-parser-js";
import { JwtHelper } from "../../../../helpers/jwt";

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const body = await req.json();
  const input = ValidationHelper.validate(LoginSchema, body);

  const rawUserAgent = req.headers.get("user-agent") || "";
  let deviceName = "Unknown Device";
  let platform = "Web";

  if (rawUserAgent) {
    const parser = new UAParser(rawUserAgent);
    const parsed = parser.getResult();
    const browser = parsed.browser.name || "Browser";
    const os = parsed.os.name || "Unknown OS";
    deviceName = `${browser} on ${os}`;
    platform = os;
  }

  const result = await authService.login(input.email, input.password, {
    deviceName,
    platform,
  });

  const verified = JwtHelper.verifyAccess(result.accessToken);
  const userRole = verified?.role || "User";

  await ActivityLog.create({
    user: result.user._id,
    role: userRole,
    action: "Login",
    entity: "Session",
    ip: req.headers.get("x-forwarded-for") || "unknown",
    userAgent: rawUserAgent || "unknown",
  });

  const response = NextResponse.json(
    ResponseHelper.success(MESSAGES.AUTH.LOGIN_SUCCESS, result),
    { status: 200 }
  );

  response.cookies.set("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60,
  });

  response.cookies.set("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return response;
});
