
/**
 * @swagger
 * /api/auth/activate:
 *   post:
 *     summary: Auto-generated summary for POST /api/auth/activate
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
import crypto from "crypto";
import { connectDB } from "../../../../config/db";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { PasswordHelper } from "../../../../helpers/password";
import { User } from "../../../../models/user.model";

/**
 * POST /api/auth/activate
 *
 * Student account activation endpoint.
 * Validates the activation token from the welcome email and sets the student's password.
 *
 * Body: { token: string, password: string }
 *
 * The token is the raw 48-char hex value from the email link.
 * Server re-hashes it to match the stored SHA-256 hash (same approach as resetPassword).
 */
export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const body = await req.json();
  const { token, password } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json(ResponseHelper.error("Activation token is required", "VALIDATION_ERROR"), { status: 400 });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      ResponseHelper.error("Password must be at least 8 characters long", "VALIDATION_ERROR"),
      { status: 400 }
    );
  }

  // Re-hash the raw token to compare against stored SHA-256 hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() },
    isDeleted: { $ne: true },
  });

  if (!user) {
    return NextResponse.json(
      ResponseHelper.error("This activation link is invalid or has expired. Please contact support.", "INVALID_TOKEN"),
      { status: 400 }
    );
  }

  // Set the real password and activate the account
  const hashedPassword = await PasswordHelper.hash(password);

  await User.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    isEmailVerified: true,
    isActive: true,
    resetPasswordToken: undefined,
    resetPasswordExpire: undefined,
  });

  return NextResponse.json(
    ResponseHelper.success("Account activated successfully. You can now log in with your email and new password."),
    { status: 200 }
  );
});
