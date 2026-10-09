
/**
 * @swagger
 * /api/public/enroll/status:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/enroll/status
 *     tags: [public]
 *     
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
import { connectDB } from "../../../../../config/db";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { Enrollment } from "../../../../../models/enrollment.model";
import { Student } from "../../../../../models/student.model";
import { CheckoutTokenService } from "../../../../../services/auth/checkout-token.service";

/**
 * GET /api/public/enroll/status?token=<checkoutToken>
 *
 * Secure public endpoint that returns enrollment status during and after payment.
 * Authenticated strictly using the short-lived checkout session token.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      ResponseHelper.error("Missing checkout session token", "UNAUTHORIZED"),
      { status: 401 }
    );
  }

  const payload = CheckoutTokenService.verifyCheckoutToken(token);
  if (!payload) {
    return NextResponse.json(
      ResponseHelper.error("Invalid or expired checkout session token", "INVALID_TOKEN"),
      { status: 401 }
    );
  }

  const enrollment = await Enrollment.findById(payload.enrollmentId).populate("course");
  if (!enrollment) {
    return NextResponse.json(
      ResponseHelper.error("Enrollment not found", "NOT_FOUND"),
      { status: 404 }
    );
  }

  const student = await Student.findById(enrollment.student);
  const course = enrollment.course as any;

  let handoffToken = "";
  if (["confirmed", "batch-assigned", "learning-started"].includes(enrollment.status) && student?.user) {
    handoffToken = CheckoutTokenService.signHandoffToken({
      userId: student.user.toString(),
      studentId: student.studentId,
      email: payload.email,
      enrollmentId: enrollment._id.toString(),
    });
  }

  return NextResponse.json(
    ResponseHelper.success("Enrollment status", {
      enrollmentNumber: enrollment.enrollmentNumber,
      status: enrollment.status,
      courseName: course?.courseName || "Unknown",
      studentId: student?.studentId,
      studentName: student ? `${student.firstName} ${student.lastName || ""}`.trim() : "Unknown",
      enrollmentDate: enrollment.enrollmentDate,
      handoffToken,
    }),
    { status: 200 }
  );
});
