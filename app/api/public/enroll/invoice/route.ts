
/**
 * @swagger
 * /api/public/enroll/invoice:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/enroll/invoice
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
import { Invoice } from "../../../../../models/invoice.model";
import { Enrollment } from "../../../../../models/enrollment.model";
import { Course } from "../../../../../models/course.model";
import { Student } from "../../../../../models/student.model";
import { FeePlan } from "../../../../../models/fee-plan.model";
import { CheckoutTokenService } from "../../../../../services/auth/checkout-token.service";
import { ParentStudentLink } from "../../../../../models/parent-student-link.model";

/**
 * GET /api/public/enroll/invoice?token=<checkoutToken>
 *
 * Secure public endpoint that returns invoice summary for the checkout page.
 * Authenticated exclusively via the short-lived checkout session token.
 * Strictly verifies child, parent, course, invoice, and enrollment bindings.
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
      ResponseHelper.error("Invalid or expired checkout session. Please re-apply.", "INVALID_TOKEN"),
      { status: 401 }
    );
  }

  const invoice = await Invoice.findById(payload.invoiceId);
  const enrollment = await Enrollment.findById(payload.enrollmentId);

  if (!invoice || !enrollment) {
    return NextResponse.json(
      ResponseHelper.error("Invoice or Enrollment not found", "NOT_FOUND"),
      { status: 404 }
    );
  }

  // 1. Authoritative Invoice - Enrollment binding check
  if (invoice.enrollment.toString() !== payload.enrollmentId) {
    return NextResponse.json(
      ResponseHelper.error("Invoice is not bound to the specified enrollment session", "FORBIDDEN"),
      { status: 403 }
    );
  }

  // 2. Child Identity Binding Check (Phase 3.5 Section 2)
  if (payload.studentId) {
    if (invoice.student.toString() !== payload.studentId || enrollment.student.toString() !== payload.studentId) {
      return NextResponse.json(
        ResponseHelper.error("Security Violation: Token student identity does not match invoice/enrollment records", "CHILD_MISMATCH"),
        { status: 403 }
      );
    }
  }

  // 3. Course Binding Check (Phase 3.5 Section 2)
  if (payload.courseId) {
    if (invoice.course.toString() !== payload.courseId || enrollment.course.toString() !== payload.courseId) {
      return NextResponse.json(
        ResponseHelper.error("Security Violation: Token course identity does not match invoice/enrollment records", "COURSE_MISMATCH"),
        { status: 403 }
      );
    }
  }

  // 4. Parent Binding Check (Phase 3.5 Section 2)
  if (payload.parentId) {
    const parentLink = await ParentStudentLink.findOne({
      parent: payload.parentId,
      student: enrollment.student,
      isDeleted: { $ne: true },
    });
    if (!parentLink) {
      return NextResponse.json(
        ResponseHelper.error("Security Violation: Parent in session token is not authorized for this child", "PARENT_MISMATCH"),
        { status: 403 }
      );
    }
  }

  const course = await Course.findById(invoice.course);
  const student = await Student.findById(invoice.student);
  const feePlan = course ? await FeePlan.findOne({ course: course._id, status: "active", isDeleted: { $ne: true } }) : null;

  return NextResponse.json(
    ResponseHelper.success("Authoritative invoice details", {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      courseId: course?._id,
      courseName: course?.courseName || "Unknown Course",
      courseCode: course?.courseCode,
      duration: course?.durationWeeks ? `${course.durationWeeks} Weeks` : "12 Weeks",
      deliveryMode: (course as any)?.deliveryMode || "Live Interactive Online",
      studentName: student ? `${student.firstName} ${student.lastName || ""}`.trim() : "Unknown",
      studentId: student?.studentId,
      studentRefId: student?._id,
      enrollmentId: enrollment?._id,
      enrollmentNumber: enrollment?.enrollmentNumber,
      baseAmount: invoice.baseAmount,
      registrationFee: feePlan?.registrationFee || 0,
      materialFee: feePlan?.materialFee || 0,
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      scholarshipAmount: invoice.scholarshipAmount,
      totalAmount: invoice.totalAmount,
      outstandingAmount: invoice.outstandingAmount,
      currency: course?.pricing?.currency || "USD",
      status: invoice.status,
      enrollmentStatus: enrollment?.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
    }),
    { status: 200 }
  );
});
