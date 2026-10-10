
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Auto-generated summary for POST /api/auth/refresh
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
import { apiHandler } from "../../../../utils/api-handler";
import { MESSAGES } from "../../../../constants/messages";

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const token = req.cookies.get("refreshToken")?.value;

  if (!token) {
    return NextResponse.json(
      ResponseHelper.error("Refresh token not found", "AUTH_TOKEN_INVALID"),
      { status: 401 }
    );
  }

  const result = await authService.refresh(token);

  const response = NextResponse.json(
    ResponseHelper.success(MESSAGES.AUTH.REFRESH_SUCCESS, result),
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
