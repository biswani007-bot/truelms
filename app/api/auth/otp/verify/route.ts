import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../config/db";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { ApiError } from "../../../../../utils/api-error";
import { ERROR_CODES } from "../../../../../constants/error-codes";
import { Otp } from "../../../../../models/otp.model";
import { userRepository } from "../../../../../repositories/user.repository";
import { authService } from "../../../../../services/auth.service";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const body = await req.json();
  const { email, otp, purpose } = body;

  if (!email || !otp || !purpose) {
    throw new ApiError(400, "email, otp, and purpose are required", ERROR_CODES.VALIDATION_ERROR);
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new ApiError(400, "Invalid OTP", ERROR_CODES.VALIDATION_ERROR);
  }

  const hashedOtpInput = crypto.createHash("sha256").update(otp.toString()).digest("hex");

  const otpRecord = await Otp.findOne({
    user: user._id,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP", ERROR_CODES.VALIDATION_ERROR);
  }

  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    otpRecord.isUsed = true; // invalidate on max attempts
    await otpRecord.save();
    throw new ApiError(429, "Too many failed attempts. Request a new OTP.", ERROR_CODES.VALIDATION_ERROR);
  }

  if (otpRecord.hashedOtp !== hashedOtpInput) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new ApiError(400, "Invalid OTP", ERROR_CODES.VALIDATION_ERROR);
  }

  // OTP verified successfully
  otpRecord.isUsed = true;
  await otpRecord.save();

  if (purpose === "login") {
    // Generate auth session
    const parser = new UAParser(req.headers.get("user-agent") || "");
    const browser = parser.getBrowser();
    const os = parser.getOS();
    
    // Using the internal oauthLogin which bypasses password check
    const result = await authService.oauthLogin(user);

    // Update Session with device metadata
    const { Session } = await import("../../../../../models/session.model");
    await Session.findOneAndUpdate(
      { refreshTokenHash: crypto.createHash("sha256").update(result.refreshToken).digest("hex") },
      {
        deviceName: browser.name || "Mobile App",
        platform: os.name || "Unknown",
        appVersion: "1.0",
      }
    );

    return NextResponse.json(
      ResponseHelper.success("Login successful", result),
      { status: 200 }
    );
  }

  return NextResponse.json(
    ResponseHelper.success("OTP verified successfully"),
    { status: 200 }
  );
});
