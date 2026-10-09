
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Auto-generated summary for POST /api/auth/change-password
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
import { ChangePasswordSchema } from "../../../../dtos/auth/change-password.dto";
import { withAuth } from "../../../../middleware/auth.middleware";
import { apiHandler } from "../../../../utils/api-handler";
import { MESSAGES } from "../../../../constants/messages";
import { ActivityLog } from "../../../../models/activity-log.model";

export const POST = withAuth(
  apiHandler(async (req: NextRequest, user) => {
    await connectDB();
    const body = await req.json();
    const input = ValidationHelper.validate(ChangePasswordSchema, body);

    await authService.changePassword(user.userId, input.oldPassword, input.newPassword);

    await ActivityLog.create({
      user: user.userId,
      role: user.role,
      action: "Change Password",
      entity: "Security",
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    const response = NextResponse.json(
      ResponseHelper.success(MESSAGES.AUTH.CHANGE_PASSWORD_SUCCESS),
      { status: 200 }
    );

    response.cookies.delete("refreshToken");
    response.cookies.delete("accessToken");

    return response;
  })
);
