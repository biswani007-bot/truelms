import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../config/db";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { ApiError } from "../../../../../utils/api-error";
import { ERROR_CODES } from "../../../../../constants/error-codes";
import { Otp } from "../../../../../models/otp.model";
import { userRepository } from "../../../../../repositories/user.repository";
import crypto from "crypto";

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const body = await req.json();
  const { email, channel, purpose } = body;

  if (!email || !channel || !purpose) {
    throw new ApiError(400, "email, channel, and purpose are required", ERROR_CODES.VALIDATION_ERROR);
  }

  if (channel === "phone") {
    throw new ApiError(400, "SMS channel unsupported", ERROR_CODES.VALIDATION_ERROR);
  }

  if (!["login", "verification", "password_reset"].includes(purpose)) {
    throw new ApiError(400, "Invalid purpose", ERROR_CODES.VALIDATION_ERROR);
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    // Return success to prevent email enumeration, but do nothing
    return NextResponse.json(
      ResponseHelper.success("OTP sent successfully if account exists"),
      { status: 200 }
    );
  }

  // Invalidate previous OTPs for this user & purpose
  await Otp.updateMany(
    { user: user._id, purpose, isUsed: false },
    { isUsed: true }
  );

  // Generate OTP
  const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otpPlain).digest("hex");

  // Save OTP
  await Otp.create({
    user: user._id,
    hashedOtp,
    purpose,
    channel,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  // SEND VIA EMAIL (Mocked logic, assuming email service exists in architecture)
  // await EmailService.sendOTP(user.email, otpPlain);
  console.log(`[DEV ONLY] OTP for ${user.email} is ${otpPlain}`);

  return NextResponse.json(
    ResponseHelper.success("OTP sent successfully"),
    { status: 200 }
  );
});
