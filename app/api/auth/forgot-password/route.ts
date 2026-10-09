
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Auto-generated summary for POST /api/auth/forgot-password
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
import { ForgotPasswordSchema } from "../../../../dtos/auth/forgot-password.dto";
import { apiHandler } from "../../../../utils/api-handler";
import { MESSAGES } from "../../../../constants/messages";

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const body = await req.json();
  const input = ValidationHelper.validate(ForgotPasswordSchema, body);

  const resetToken = await authService.forgotPassword(input.email);

  return NextResponse.json(
    ResponseHelper.success(MESSAGES.AUTH.FORGOT_PASSWORD_SENT, { resetToken }),
    { status: 200 }
  );
});
