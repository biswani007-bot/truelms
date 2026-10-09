/**
 * @swagger
 * /api/crm/leads/{id}/enroll:
 *   post:
 *     summary: Counsellor Admissions Conversion API
 *     description: Converts a Lead into an authoritative Enrollment + Invoice for an authenticated Child/Student.
 *     tags: [crm]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Enrollment and invoice generated successfully
 *       400:
 *         description: Validation error or missing child link
 *       403:
 *         description: Forbidden or unlinked parent-child relationship
 *       404:
 *         description: Lead not found
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withRoles } from "@/middleware/auth.middleware";
import { leadRepository } from "@/repositories/lead.repository";
import { leadTimelineRepository } from "@/repositories/lead-timeline.repository";
import { Course } from "@/models/course.model";
import { FeePlan } from "@/models/fee-plan.model";
import { Invoice } from "@/models/invoice.model";
import { Enrollment } from "@/models/enrollment.model";
import { Student } from "@/models/student.model";
import { Parent } from "@/models/parent.model";
import { ParentStudentLink } from "@/models/parent-student-link.model";
import { DemoSession } from "@/models/demo-session.model";
import { Cohort } from "@/models/cohort.model";
import { AcademicSession } from "@/models/academic-session.model";
import { CheckoutTokenService } from "@/services/auth/checkout-token.service";
import { ResponseHelper } from "@/helpers/response";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";
import { FinanceCalculationService } from "@/services/finance/finance-calculation.service";
import { Lead } from "@/models/lead.model";

/**
 * POST /api/crm/leads/[id]/enroll
 *
 * Counsellor Admissions Conversion API:
 * Transitions a qualified Lead into an authoritative Enrollment + Invoice.
 *
 * CRITICAL IDENTITY INTEGRITY GUARANTEES:
 * 1. NEVER parses lead.notes for child identity.
 * 2. NEVER overwrites or alters the Parent User record.
 * 3. NEVER changes Parent role to Student.
 * 4. Authoritatively resolves: Lead -> Parent -> Student -> ParentStudentLink -> Course -> Enrollment.
 * 5. enrollment.student is ALWAYS the authoritative Student._id.
 */
export const POST = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"],
  apiHandler(async (req: NextRequest, arg1: any, arg2?: any) => {
    await connectDB();
    const segmentData = (arg2 && arg2.params) ? arg2 : arg1;
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json().catch(() => ({}));

    // 1. Verify Lead exists
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        ResponseHelper.error("Lead record not found", "NOT_FOUND"),
        { status: 404 }
      );
    }

    const lead = await leadRepository.findById(id);
    if (!lead) {
      return NextResponse.json(
        ResponseHelper.error("Lead record not found", "NOT_FOUND"),
        { status: 404 }
      );
    }

    const email = lead.email.toLowerCase().trim();

    // 2. Authoritative Student Resolution
    // Resolve Student from:
    // a. lead.student (direct authoritative link)
    // b. body.studentId (counsellor selected explicit child)
    // c. DemoSession linked to this lead with an authoritative student
    let resolvedStudentId: mongoose.Types.ObjectId | null = null;

    if (lead.student && mongoose.isValidObjectId(lead.student)) {
      resolvedStudentId = new mongoose.Types.ObjectId(lead.student.toString());
    } else if (body.studentId && mongoose.isValidObjectId(body.studentId)) {
      resolvedStudentId = new mongoose.Types.ObjectId(body.studentId);
    } else {
      // Check if there is an authoritative DemoSession linked to this lead
      const linkedDemo = await DemoSession.findOne({
        lead: lead._id,
        student: { $exists: true, $ne: null },
        isDeleted: { $ne: true },
      });
      if (linkedDemo?.student) {
        resolvedStudentId = new mongoose.Types.ObjectId(linkedDemo.student.toString());
      }
    }

    // If still no student reference can be resolved, return clear actionable error
    if (!resolvedStudentId) {
      return NextResponse.json(
        ResponseHelper.error(
          "Child/student is not linked to this lead. Select the correct child before starting enrollment.",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    // 3. Authoritative Parent Resolution
    let resolvedParentId: mongoose.Types.ObjectId | null = null;
    if (lead.parent && mongoose.isValidObjectId(lead.parent)) {
      resolvedParentId = new mongoose.Types.ObjectId(lead.parent.toString());
    } else {
      const parentDoc = await Parent.findOne({ email });
      if (parentDoc) {
        resolvedParentId = parentDoc._id;
      }
    }

    let parent: any = null;
    if (resolvedParentId) {
      parent = await Parent.findById(resolvedParentId);
    }

    if (!parent) {
      return NextResponse.json(
        ResponseHelper.error(
          "Parent profile not found for this lead. Ensure parent account exists.",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    // 4. Verify Student Record Exists and is Valid
    const student = await Student.findOne({ _id: resolvedStudentId, isDeleted: { $ne: true } });
    if (!student) {
      return NextResponse.json(
        ResponseHelper.error(
          "Referenced student not found or has been deactivated.",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    if (["suspended", "dropped"].includes(student.status)) {
      return NextResponse.json(
        ResponseHelper.error(
          `Cannot enroll student with status '${student.status}'. Student profile must be active or pending admission.`,
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    // 5. Authoritatively Validate ParentStudentLink
    const link = await ParentStudentLink.findOne({
      parent: parent._id,
      student: student._id,
      isDeleted: { $ne: true },
    });

    if (!link) {
      return NextResponse.json(
        ResponseHelper.error(
          "Parent is not linked to the specified student. Ensure parent-child relationship is valid before enrollment.",
          "FORBIDDEN"
        ),
        { status: 403 }
      );
    }

    // Persist authoritative links onto Lead if not already stored
    if (!lead.parent || !lead.student) {
      await Lead.findByIdAndUpdate(lead._id, {
        parent: parent._id,
        student: student._id,
      });
    }

    // 6. Authoritative Course Resolution
    let course: any = null;
    if (body.courseId && mongoose.isValidObjectId(body.courseId)) {
      course = await Course.findById(body.courseId);
    } else if (body.courseSlug) {
      course = await Course.findOne({ slug: body.courseSlug, status: "published", isDeleted: { $ne: true } });
    } else if (lead.course && mongoose.isValidObjectId(lead.course)) {
      course = await Course.findById(lead.course);
    } else if (lead.interestedCourse) {
      const cleaned = lead.interestedCourse.trim();
      course = await Course.findOne({
        $or: [
          { courseName: cleaned },
          { courseName: new RegExp(`^${cleaned.replace(/[-_]/g, "[-_ ]")}$`, "i") },
          { slug: cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          { courseCode: cleaned.toUpperCase() },
        ],
        status: "published",
        isDeleted: { $ne: true },
      });
    }

    if (!course || course.isDeleted) {
      return NextResponse.json(
        ResponseHelper.error(
          "Target course could not be resolved for this lead. Ensure a valid course is attached.",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    // 7. Verify Authoritative Demo Completion Gate
    const demo = await DemoSession.findOne({
      student: student._id,
      course: course._id,
      status: "completed",
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    if (!demo) {
      return NextResponse.json(
        ResponseHelper.error(
          "Cannot initiate enrollment: Child has not completed a demo session for this course. Enrollment is unlocked only upon demo completion.",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
      );
    }

    // 8. Academic Session & Cohort
    const academicSession = await AcademicSession.findOne({ status: "active" });
    const sessionName = academicSession?.name || "2026";

    let cohort = await Cohort.findOne({ course: course._id, status: "enrollment-open", isDeleted: { $ne: true } });
    if (!cohort) {
      cohort = await Cohort.findOne({ course: course._id, isDeleted: { $ne: true } });
    }

    // 9. Inspect Existing Enrollment & Enforce Child/Course Integrity
    let enrollment = await Enrollment.findOne({
      student: student._id,
      course: course._id,
      status: { $in: ["waiting-payment", "pending", "confirmed", "batch-assigned", "learning-started"] },
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    // Also check if an enrollment is already linked to this lead
    if (!enrollment && (lead as any).enrollment) {
      const linkedEnrollment = await Enrollment.findById((lead as any).enrollment);
      if (linkedEnrollment && !linkedEnrollment.isDeleted) {
        if (linkedEnrollment.student.toString() !== student._id.toString()) {
          return NextResponse.json(
            ResponseHelper.error(
              "Conflicting enrollment detected: Existing enrollment is associated with a different student. Cannot proceed.",
              "CONFLICT_ERROR"
            ),
            { status: 409 }
          );
        }
        if (linkedEnrollment.course.toString() !== course._id.toString()) {
          return NextResponse.json(
            ResponseHelper.error(
              "Conflicting enrollment detected: Existing enrollment is associated with a different course. Cannot proceed.",
              "CONFLICT_ERROR"
            ),
            { status: 409 }
          );
        }
        enrollment = linkedEnrollment;
      }
    }

    let isNewEnrollment = false;
    if (!enrollment) {
      isNewEnrollment = true;
      // Collision-free enrollment number generation
      let enrollmentNumber = "";
      let isUnique = false;
      let count = await Enrollment.countDocuments({ isDeleted: { $in: [true, false] } });
      while (!isUnique) {
        count++;
        enrollmentNumber = `ENR-${String(count).padStart(5, "0")}`;
        const existing = await Enrollment.findOne({
          enrollmentNumber,
          isDeleted: { $in: [true, false] },
        });
        if (!existing) isUnique = true;
      }

      enrollment = await Enrollment.create({
        enrollmentNumber,
        student: student._id,
        lead: lead._id,
        course: course._id,
        cohort: cohort?._id,
        academicSession: sessionName,
        enrollmentDate: new Date(),
        status: "waiting-payment",
        paymentStatus: "unpaid",
        notes: body.notes || `Initiated by counsellor from CRM Lead #${lead.leadId}`,
      });
    } else {
      // Diagnostic check: Ensure existing enrollment belongs to the authoritative student and course
      if (enrollment.student.toString() !== student._id.toString()) {
        return NextResponse.json(
          ResponseHelper.error(
            "Conflicting enrollment detected: Existing enrollment belongs to another child.",
            "CONFLICT_ERROR"
          ),
          { status: 409 }
        );
      }
      if (enrollment.course.toString() !== course._id.toString()) {
        return NextResponse.json(
          ResponseHelper.error(
            "Conflicting enrollment detected: Existing enrollment is for a different course.",
            "CONFLICT_ERROR"
          ),
          { status: 409 }
        );
      }
    }

    // 10. Inspect or Generate Authoritative Invoice
    let invoice = await Invoice.findOne({
      enrollment: enrollment._id,
      status: { $in: ["issued", "pending", "paid"] },
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    if (invoice) {
      // Verify invoice integrity
      if (invoice.student && invoice.student.toString() !== student._id.toString()) {
        return NextResponse.json(
          ResponseHelper.error(
            "Conflicting invoice detected: Existing invoice is associated with a different student.",
            "CONFLICT_ERROR"
          ),
          { status: 409 }
        );
      }
      if (invoice.course && invoice.course.toString() !== course._id.toString()) {
        return NextResponse.json(
          ResponseHelper.error(
            "Conflicting invoice detected: Existing invoice is associated with a different course.",
            "CONFLICT_ERROR"
          ),
          { status: 409 }
        );
      }
    } else {
      // Calculate server-authoritative pricing
      const feePlan = await FeePlan.findOne({ course: course._id, status: "active", isDeleted: { $ne: true } });

      let grossAmountCents = 0;
      let taxAmountCents = 0;
      let totalAmountCents = 0;

      if (feePlan) {
        const basePlusReg = FinanceCalculationService.add(feePlan.baseFee, feePlan.registrationFee);
        grossAmountCents = FinanceCalculationService.add(basePlusReg, feePlan.materialFee);
        taxAmountCents = FinanceCalculationService.multiply(grossAmountCents, feePlan.tax / 100);
        totalAmountCents = FinanceCalculationService.add(grossAmountCents, taxAmountCents);
      } else {
        const priceInCents = (course.pricing?.discountPrice || course.pricing?.price || 500) * 100;
        const taxPercent = course.pricing?.taxPercentage || 10;
        taxAmountCents = Math.round((priceInCents * taxPercent) / 100);
        grossAmountCents = priceInCents;
        totalAmountCents = priceInCents + taxAmountCents;
      }

      // Collision-free invoice number generation
      let invoiceNumber = "";
      let isInvUnique = false;
      let invCount = await Invoice.countDocuments({ isDeleted: { $in: [true, false] } });
      while (!isInvUnique) {
        invCount++;
        invoiceNumber = `INV-${String(invCount).padStart(6, "0")}`;
        const existing = await Invoice.findOne({
          invoiceNumber,
          isDeleted: { $in: [true, false] },
        });
        if (!existing) isInvUnique = true;
      }

      invoice = await Invoice.create({
        invoiceNumber,
        enrollment: enrollment._id,
        student: student._id,
        course: course._id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        baseAmount: grossAmountCents,
        taxAmount: taxAmountCents,
        discountAmount: 0,
        scholarshipAmount: 0,
        totalAmount: totalAmountCents,
        outstandingAmount: totalAmountCents,
        status: "issued",
      });
    }

    // 11. Update Lead Status and Timeline
    const targetLeadStatus = (enrollment.status === "confirmed" || enrollment.status === "batch-assigned") ? "enrolled" : "enrollment_pending";
    await leadRepository.update(id, {
      status: targetLeadStatus,
      parent: parent._id,
      student: student._id,
      course: course._id,
      notes: `${lead.notes || ""}\n\n[Counsellor Action]: ${isNewEnrollment ? "Initiated" : "Retrieved"} enrollment ${enrollment.enrollmentNumber} for student ${student.firstName} ${student.lastName} (${student.studentId}) in course "${course.courseName}" (Invoice ${invoice.invoiceNumber})`,
    });

    try {
      await leadTimelineRepository.create({
        lead: new mongoose.Types.ObjectId(id),
        event: isNewEnrollment ? "enrollment_initiated" : "enrollment_retrieved",
        description: `Enrollment ${enrollment.enrollmentNumber} for student ${student.firstName} ${student.lastName} in ${course.courseName} (Invoice ${invoice.invoiceNumber}).`,
        timestamp: new Date(),
      });
    } catch {
      // Non-blocking timeline creation
    }

    // 12. Sign Secure Checkout Session Token (explicitly child-bound claims)
    const checkoutToken = CheckoutTokenService.signCheckoutToken({
      enrollmentId: enrollment._id.toString(),
      invoiceId: invoice._id.toString(),
      email,
      studentId: student._id.toString(),
      parentId: parent._id.toString(),
      courseId: course._id.toString(),
    });

    const checkoutUrl = `/checkout?session=${encodeURIComponent(checkoutToken)}`;

    return NextResponse.json(
      ResponseHelper.success(
        isNewEnrollment ? "Enrollment initiated successfully (payment required)" : "Existing enrollment retrieved successfully",
        {
          enrollmentId: enrollment._id,
          enrollmentNumber: enrollment.enrollmentNumber,
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          courseName: course.courseName,
          courseSlug: course.slug,
          totalAmount: invoice.totalAmount,
          checkoutToken,
          checkoutUrl,
          studentId: student.studentId,
          childName: `${student.firstName} ${student.lastName}`,
          isNewEnrollment,
          isNewUser: false,
          status: enrollment.status,
        }
      ),
      { status: isNewEnrollment ? 201 : 200 }
    );
  })
);
