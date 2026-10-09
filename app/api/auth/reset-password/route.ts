
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Auto-generated summary for POST /api/auth/reset-password
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
import { ResetPasswordSchema } from "../../../../dtos/auth/reset-password.dto";
import { apiHandler } from "../../../../utils/api-handler";
import { MESSAGES } from "../../../../constants/messages";

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const body = await req.json();
  const input = ValidationHelper.validate(ResetPasswordSchema, body);

  await authService.resetPassword(input.token, input.password);

  return NextResponse.json(
    ResponseHelper.success(MESSAGES.AUTH.RESET_PASSWORD_SUCCESS),
    { status: 200 }
  );
});
