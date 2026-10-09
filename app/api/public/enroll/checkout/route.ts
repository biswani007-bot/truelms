
/**
 * @swagger
 * /api/public/enroll/checkout:
 *   post:
 *     summary: Auto-generated summary for POST /api/public/enroll/checkout
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
import { Invoice } from "../../../../../models/invoice.model";
import { ParentStudentLink } from "../../../../../models/parent-student-link.model";
import { PaymentService } from "../../../../../services/finance/payment.service";
import { registerJobHandlers } from "../../../../../services/jobs/job-handlers";
import { JobEngineService } from "../../../../../services/jobs/job-engine.service";
import { CheckoutTokenService } from "../../../../../services/auth/checkout-token.service";
import { AuditService } from "../../../../../services/audit/audit.service";
import { logger } from "../../../../../utils/logger";

/**
 * POST /api/public/enroll/checkout
 *
 * DEVELOPMENT-ONLY payment test boundary.
 *
 * CRITICAL SAFETY CHECKS:
 * 1. Rejects execution if NODE_ENV === "production"
 * 2. Authenticated exclusively via short-lived checkout session token
 * 3. Server independently reloads authoritative invoice amount from MongoDB (never trusts client amount)
 * 4. PaymentService records payment -> emits canonical Payment.completed durable business event
 * 5. JobEngine executes downstream automation
 *
 * Body: { checkoutToken }
 */
export const POST = apiHandler(async (req: NextRequest) => {
  // 1. Environment Safety Check: Must NEVER execute in production
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_PAYMENT !== "true" && process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
    return NextResponse.json(
      ResponseHelper.error("Development payment gateway is disabled in production environment", "FORBIDDEN"),
      { status: 403 }
    );
  }

  await connectDB();
  registerJobHandlers();

  const body = await req.json();
  const { checkoutToken } = body;

  if (!checkoutToken) {
    return NextResponse.json(
      ResponseHelper.error("Missing checkout session token", "UNAUTHORIZED"),
      { status: 401 }
    );
  }

  // 2. Validate Checkout Token
  const payload = CheckoutTokenService.verifyCheckoutToken(checkoutToken);
  if (!payload) {
    return NextResponse.json(
      ResponseHelper.error("Invalid or expired checkout session token", "INVALID_TOKEN"),
      { status: 401 }
    );
  }

  const { enrollmentId, invoiceId } = payload;

  // 3. Authoritative Enrollment Validation
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    return NextResponse.json(
      ResponseHelper.error("Enrollment record not found", "NOT_FOUND"),
      { status: 404 }
    );
  }

  // 4. Server-Authoritative Invoice Reload (NEVER trust client amounts)
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return NextResponse.json(
      ResponseHelper.error("Invoice record not found", "NOT_FOUND"),
      { status: 404 }
    );
  }

  if (invoice.enrollment.toString() !== enrollmentId) {
    return NextResponse.json(
      ResponseHelper.error("Invoice does not match the authenticated enrollment session", "FORBIDDEN"),
      { status: 403 }
    );
  }

  // Child Identity Binding Check (Phase 3.5 Section 2 & 5)
  if (payload.studentId) {
    if (invoice.student.toString() !== payload.studentId || enrollment.student.toString() !== payload.studentId) {
      return NextResponse.json(
        ResponseHelper.error("Security Violation: Token student identity does not match invoice/enrollment records", "CHILD_MISMATCH"),
        { status: 403 }
      );
    }
  }

  // Course Binding Check (Phase 3.5 Section 2 & 5)
  if (payload.courseId) {
    if (invoice.course.toString() !== payload.courseId || enrollment.course.toString() !== payload.courseId) {
      return NextResponse.json(
        ResponseHelper.error("Security Violation: Token course identity does not match invoice/enrollment records", "COURSE_MISMATCH"),
        { status: 403 }
      );
    }
  }

  // Parent Binding Check (Phase 3.5 Section 2 & 5)
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

  if (enrollment.status !== "waiting-payment") {
    return NextResponse.json(
      ResponseHelper.success("Payment already processed for this enrollment", {
        enrollmentId: enrollment._id,
        status: enrollment.status,
      }),
      { status: 200 }
    );
  }

  if (invoice.status === "paid" || invoice.outstandingAmount <= 0) {
    return NextResponse.json(
      ResponseHelper.success("Invoice is already fully settled", { status: "paid" }),
      { status: 200 }
    );
  }

  // Authoritative payable amount loaded directly from MongoDB
  const authoritativeAmount = invoice.outstandingAmount > 0 ? invoice.outstandingAmount : invoice.totalAmount;

  // 5. Authoritative Payment Recording
  // PaymentService automatically updates invoice, issues receipt, and publishes canonical Payment.completed event
  const payment = await PaymentService.recordPayment({
    invoiceId: invoice._id.toString(),
    amount: authoritativeAmount,
    paymentMethod: "online-gateway",
    transactionReference: `DEV-PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
  });

  // 6. Run background jobs synchronously in development to finalize side effects immediately
  const jobsProcessed = await JobEngineService.runBatch(10);

  // 7. Audit log
  await AuditService.logMutation({
    action: "development-payment.processed",
    entity: "Payment",
    entityId: payment._id.toString(),
    metadata: {
      enrollmentId,
      invoiceId,
      amount: authoritativeAmount,
      gateway: "development-boundary",
      jobsProcessed,
    },
  });

  const updatedEnrollment = await Enrollment.findById(enrollmentId).populate("student");
  const student = updatedEnrollment?.student as any;

  // Issue single-purpose, short-lived (10 min) handoff token for smooth Student Portal access
  let handoffToken = "";
  if (student?.user) {
    handoffToken = CheckoutTokenService.signHandoffToken({
      userId: student.user.toString(),
      studentId: student.studentId,
      email: payload.email,
      enrollmentId,
    });
  }

  logger.info(`[DevCheckout] Authoritative payment recorded for enrollment ${enrollment.enrollmentNumber} ($${(authoritativeAmount / 100).toFixed(2)}), ${jobsProcessed} jobs processed`);

  return NextResponse.json(
    ResponseHelper.success("Payment completed successfully via development gateway", {
      paymentId: payment._id,
      paymentNumber: payment.paymentNumber,
      amount: authoritativeAmount,
      enrollmentStatus: updatedEnrollment?.status || enrollment.status,
      handoffToken,
      jobsProcessed,
    }),
    { status: 200 }
  );
});
