
/**
 * @swagger
 * /api/public/enroll:
 *   post:
 *     summary: Auto-generated summary for POST /api/public/enroll
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
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../config/db";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { Course } from "../../../../models/course.model";
import { Student } from "../../../../models/student.model";
import { User } from "../../../../models/user.model";
import { Role } from "../../../../models/role.model";
import { Enrollment } from "../../../../models/enrollment.model";
import { Lead } from "../../../../models/lead.model";
import { FeePlan } from "../../../../models/fee-plan.model";
import { Invoice } from "../../../../models/invoice.model";
import { FinanceCalculationService } from "../../../../services/finance/finance-calculation.service";
import { CheckoutTokenService } from "../../../../services/auth/checkout-token.service";
import { AuditService } from "../../../../services/audit/audit.service";
import { logger } from "../../../../utils/logger";

/**
 * POST /api/public/enroll
 *
 * Public unauthenticated endpoint that creates the complete pre-payment state:
 * Lead → Student → User → Enrollment (waiting-payment) → Invoice (issued)
 *
 * Employs deterministic idempotency: If the applicant submits repeatedly for the same
 * course while a pending/waiting-payment enrollment exists, reuses and returns that
 * enrollment state along with a newly signed checkout session token.
 *
 * Does NOT confirm enrollment. Payment is the required gate.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const body = await req.json();
  const { firstName, lastName, email, phone, courseSlug, courseId, message } = body;

  // Validate required fields
  if (!firstName || !email || !phone) {
    return NextResponse.json(
      ResponseHelper.error("Missing required fields: firstName, email, phone"),
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      ResponseHelper.error("Invalid email address"),
      { status: 400 }
    );
  }

  // Find the course by slug or ID with active/published validation
  let course: any = null;
  if (courseSlug) {
    course = await Course.findOne({
      slug: courseSlug,
      status: "published",
      isDeleted: { $ne: true },
    }).populate("category");
  } else if (courseId) {
    course = await Course.findOne({
      _id: courseId,
      status: "published",
      isDeleted: { $ne: true },
    }).populate("category");
  }

  if (!course) {
    return NextResponse.json(
      ResponseHelper.error("The selected course is not found or is no longer available for public enrollment."),
      { status: 404 }
    );
  }

  // Validate that the course has an authoritative price or fee plan configured
  const existingFeePlan = await FeePlan.findOne({ course: course._id, status: "active", isDeleted: { $ne: true } });
  const rawCoursePrice = course.pricing?.discountPrice || course.pricing?.price || 0;
  if (!existingFeePlan && rawCoursePrice <= 0) {
    return NextResponse.json(
      ResponseHelper.error("This course is currently unavailable for online enrollment. Please contact admissions."),
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Idempotency Check: Existing user and pending or confirmed enrollment
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const existingStudent = await Student.findOne({ user: existingUser._id });
    if (existingStudent) {
      const existingEnrollment = await Enrollment.findOne({
        student: existingStudent._id,
        course: course._id,
        status: { $in: ["pending", "approved", "waiting-payment", "confirmed", "batch-assigned", "learning-started"] },
        isDeleted: { $ne: true },
      });

      if (existingEnrollment) {
        let existingInvoice = await Invoice.findOne({
          enrollment: existingEnrollment._id,
        });

        // If invoice missing for some reason, generate it
        if (!existingInvoice) {
          const priceInCents = (course.pricing?.discountPrice || course.pricing?.price || 0) * 100;
          const taxPercent = course.pricing?.taxPercentage || 0;
          const taxAmount = Math.round((priceInCents * taxPercent) / 100);
          const totalAmount = priceInCents + taxAmount;

          const invoiceCount = await Invoice.countDocuments();
          const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, "0")}`;

          existingInvoice = await Invoice.create({
            invoiceNumber,
            enrollment: existingEnrollment._id,
            student: existingStudent._id,
            course: course._id,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            baseAmount: priceInCents,
            taxAmount,
            discountAmount: 0,
            scholarshipAmount: 0,
            totalAmount,
            outstandingAmount: totalAmount,
            status: existingEnrollment.status === "waiting-payment" ? "issued" : "paid",
          });
        }

        const checkoutToken = CheckoutTokenService.signCheckoutToken({
          enrollmentId: existingEnrollment._id.toString(),
          invoiceId: existingInvoice._id.toString(),
          email: normalizedEmail,
        });

        return NextResponse.json(
          ResponseHelper.success("Existing enrollment record retrieved", {
            enrollmentId: existingEnrollment._id,
            enrollmentNumber: existingEnrollment.enrollmentNumber,
            invoiceId: existingInvoice._id,
            invoiceNumber: existingInvoice.invoiceNumber,
            totalAmount: existingInvoice.totalAmount,
            currency: course.pricing?.currency || "USD",
            courseName: course.courseName,
            studentId: existingStudent.studentId,
            status: existingEnrollment.status,
            checkoutToken,
          }),
          { status: 200 }
        );
      }
    }
  }

  // 2. Create or reuse Lead (CRM)
  let lead: any = null;
  try {
    lead = await Lead.findOne({ email: normalizedEmail });
    if (!lead) {
      const leadCount = await Lead.countDocuments();
      const leadId = `LED-${String(leadCount + 1).padStart(4, "0")}`;
      lead = await Lead.create({
        leadId,
        fullName: `${firstName} ${lastName || ""}`.trim(),
        email: normalizedEmail,
        phone,
        interestedCourse: course.courseName,
        leadSource: "website" as const,
        learningMode: "live" as const,
        priority: "high" as const,
        status: "application_submitted" as const,
        notes: message || "",
        tags: ["public-enrollment"],
      });
    } else {
      lead.status = "application_submitted";
      if (course.courseName) lead.interestedCourse = course.courseName;
      await lead.save();
    }
  } catch (err: any) {
    logger.warn(`[PublicEnroll] Lead record synchronization notice: ${err.message}`);
  }

  // 3. Create Student User account (unverified, temporary password)
  const studentRole = await Role.findOne({ name: { $regex: /^student$/i } });
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), salt);
    user = await User.create({
      firstName,
      lastName: lastName || "",
      email: normalizedEmail,
      password: tempHash,
      role: studentRole?._id,
      isEmailVerified: false,
    });
  }

  // 4. Create Student profile with only applicant-supplied real data (no fabricated identity info)
  let student = await Student.findOne({ user: user._id });
  if (!student) {
    const studentCount = await Student.countDocuments();
    const studentIdNum = String(studentCount + 1).padStart(5, "0");
    student = await Student.create({
      user: user._id,
      studentId: `STU-${studentIdNum}`,
      admissionNumber: `ADM-${studentIdNum}`,
      registrationNumber: `REG-${studentIdNum}`,
      firstName,
      lastName: lastName || "",
      phone,
      status: "registered" as const,
      preferences: {
        language: "en",
        timezone: "UTC",
        notificationPref: "email" as const,
      },
    });
  }

  // 5. Create Enrollment in waiting-payment state
  const enrollmentCount = await Enrollment.countDocuments();
  const enrollmentNumber = `ENR-${String(enrollmentCount + 1).padStart(5, "0")}`;
  const enrollment = await Enrollment.create({
    enrollmentNumber,
    student: student._id,
    lead: lead?._id,
    course: course._id,
    enrollmentDate: new Date(),
    academicSession: new Date().getFullYear().toString(),
    status: "waiting-payment",
  });

  // 6. Generate Authoritative Invoice
  const feePlan = await FeePlan.findOne({ course: course._id, isDeleted: { $ne: true } });

  let invoice: any;
  if (feePlan) {
    const baseAmount = FinanceCalculationService.add(feePlan.baseFee, feePlan.registrationFee);
    const gross = FinanceCalculationService.add(baseAmount, feePlan.materialFee);
    const taxAmount = FinanceCalculationService.multiply(gross, feePlan.tax / 100);
    const totalAmount = FinanceCalculationService.add(gross, taxAmount);

    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, "0")}`;

    invoice = await Invoice.create({
      invoiceNumber,
      enrollment: enrollment._id,
      student: student._id,
      course: course._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      baseAmount: gross,
      taxAmount,
      discountAmount: 0,
      scholarshipAmount: 0,
      totalAmount,
      outstandingAmount: totalAmount,
      status: "issued",
    });
  } else {
    // Authoritative Course price in cents
    const priceInCents = (course.pricing?.discountPrice || course.pricing?.price || 0) * 100;
    const taxPercent = course.pricing?.taxPercentage || 0;
    const taxAmount = Math.round((priceInCents * taxPercent) / 100);
    const totalAmount = priceInCents + taxAmount;

    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, "0")}`;

    invoice = await Invoice.create({
      invoiceNumber,
      enrollment: enrollment._id,
      student: student._id,
      course: course._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      baseAmount: priceInCents,
      taxAmount,
      discountAmount: 0,
      scholarshipAmount: 0,
      totalAmount,
      outstandingAmount: totalAmount,
      status: "issued",
    });
  }

  // 7. Sign a secure, short-lived checkout session token
  const checkoutToken = CheckoutTokenService.signCheckoutToken({
    enrollmentId: enrollment._id.toString(),
    invoiceId: invoice._id.toString(),
    email: normalizedEmail,
  });

  // 8. Audit trail
  await AuditService.logMutation({
    action: "public-enrollment.created",
    entity: "Enrollment",
    entityId: enrollment._id.toString(),
    metadata: {
      enrollmentNumber,
      studentId: student.studentId,
      courseCode: course.courseCode,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
    },
  });

  logger.info(`[PublicEnroll] Created enrollment ${enrollmentNumber} for ${normalizedEmail}, invoice ${invoice.invoiceNumber}`);

  return NextResponse.json(
    ResponseHelper.success("Enrollment created successfully. Proceed to payment.", {
      enrollmentId: enrollment._id,
      enrollmentNumber,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      currency: course.pricing?.currency || "USD",
      courseName: course.courseName,
      studentId: student.studentId,
      status: "waiting-payment",
      checkoutToken,
    }),
    { status: 201 }
  );
});
