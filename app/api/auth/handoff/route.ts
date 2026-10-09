
/**
 * @swagger
 * /api/auth/handoff:
 *   get:
 *     summary: Auto-generated summary for GET /api/auth/handoff
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { ResponseHelper } from "@/helpers/response";
import { apiHandler } from "@/utils/api-handler";
import { CheckoutTokenService } from "@/services/auth/checkout-token.service";
import { User } from "@/models/user.model";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";

/**
 * GET /api/auth/handoff?token=<handoffToken>
 *
 * Verifies a single-purpose, short-lived student login handoff token.
 * Returns authorized prefill context (email, student name, studentId) so the user
 * can securely sign in through the authoritative /api/auth/login flow.
 * Does NOT return or accept raw permanent credentials.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      ResponseHelper.error("Missing handoff token", "UNAUTHORIZED"),
      { status: 401 }
    );
  }

  const payload = CheckoutTokenService.verifyHandoffToken(token);
  if (!payload) {
    return NextResponse.json(
      ResponseHelper.error("Handoff session expired or invalid. Please sign in directly.", "INVALID_TOKEN"),
      { status: 401 }
    );
  }

  const user = await User.findById(payload.userId);
  if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
    return NextResponse.json(
      ResponseHelper.error("User record not found or email mismatch", "NOT_FOUND"),
      { status: 404 }
    );
  }

  const student = await Student.findOne({ user: user._id });
  const enrollment = await Enrollment.findById(payload.enrollmentId).populate("course");

  return NextResponse.json(
    ResponseHelper.success("Handoff session authorized", {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: student?.studentId,
      courseName: (enrollment?.course as any)?.courseName || "Your Enrolled Course",
      enrollmentStatus: enrollment?.status,
    }),
    { status: 200 }
  );
});
