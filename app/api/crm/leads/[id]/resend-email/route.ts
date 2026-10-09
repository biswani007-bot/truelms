import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "@/middleware/auth.middleware";
import { leadRepository } from "@/repositories/lead.repository";
import { ResponseHelper } from "@/helpers/response";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";
import { DemoSession } from "@/models/demo-session.model";
import { Enrollment } from "@/models/enrollment.model";
import { Invoice } from "@/models/invoice.model";
import { Payment } from "@/models/payment.model";
import { Receipt } from "@/models/receipt.model";
import { Parent } from "@/models/parent.model";
import { Student } from "@/models/student.model";
import { Course } from "@/models/course.model";
import { JobEngineService } from "@/services/jobs/job-engine.service";
import { CheckoutTokenService } from "@/services/auth/checkout-token.service";
import { ActivityLog } from "@/models/activity-log.model";

/**
 * POST /api/crm/leads/[id]/resend-email
 * Allows Admin / Sales Counsellor to manually resend:
 * 1. "enrollment_offer": Enrollment offer link & fee details
 * 2. "payment_confirmation": Payment confirmation statement
 * 3. "receipt": Official receipt confirmation
 *
 * Uses the same official email templates/JobEngine and records an audit log.
 */
export const POST = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager", "Academic Manager"],
  apiHandler(async (req: NextRequest, arg1: any, arg2?: any) => {
    await connectDB();
    const segmentData = (arg2 && arg2.params) ? arg2 : arg1;
    const params = await segmentData.params;
    const { id } = params;

    const body = await req.json().catch(() => ({}));
    const { emailType = "enrollment_offer" } = body;

    const lead = await leadRepository.findById(id);
    if (!lead) {
      return NextResponse.json(ResponseHelper.error("Lead not found", "NOT_FOUND"), { status: 404 });
    }

    const parent = lead.parent ? await Parent.findById(lead.parent) : await Parent.findOne({ email: lead.email });
    const student = lead.student ? await Student.findById(lead.student) : null;
    const parentEmail = parent?.email || lead.email;
    const parentName = parent ? `${parent.firstName} ${parent.lastName}`.trim() : lead.fullName;
    const childName = student ? `${student.firstName} ${student.lastName}`.trim() : lead.fullName;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

    if (emailType === "enrollment_offer") {
      // Find or create enrollment & invoice to generate valid checkout link
      const enrollment = await Enrollment.findOne({
        $or: [{ lead: lead._id }, ...(lead.student ? [{ student: lead.student }] : [])],
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });

      let checkoutUrl = `${appUrl}/parent/dashboard`;
      if (enrollment) {
        const invoice = await Invoice.findOne({ enrollment: enrollment._id, isDeleted: { $ne: true } });
        if (invoice) {
          const checkoutToken = CheckoutTokenService.signCheckoutToken({
            enrollmentId: enrollment._id.toString(),
            invoiceId: invoice._id.toString(),
            email: parentEmail,
          });
          checkoutUrl = `${appUrl}/checkout?session=${encodeURIComponent(checkoutToken)}`;
        }
      }

      await JobEngineService.scheduleJob({
        jobType: "demo.completed",
        entityType: "Lead",
        entityId: lead._id.toString(),
        payload: {
          parentEmail,
          parentName,
          childName,
          programName: lead.interestedCourse,
          checkoutUrl,
        },
        idempotencyKey: `resend-enrollment-${lead._id}-${Date.now()}`,
        priority: "high",
      });

      // Execute immediately
      const { registerJobHandlers } = await import("@/services/jobs/job-handlers");
      registerJobHandlers();
      await JobEngineService.processNextJob().catch(() => {});

      await ActivityLog.create({
        entity: "Lead",
        entityId: lead._id.toString(),
        action: "RESEND_ENROLLMENT_EMAIL",
        details: `Resent enrollment offer email to ${parentEmail}`,
      }).catch(() => {});

      return NextResponse.json(ResponseHelper.success(`Enrollment offer email resent to ${parentEmail}`));
    }

    if (emailType === "payment_confirmation" || emailType === "receipt") {
      const payment = await Payment.findOne({
        ...(lead.student ? { student: lead.student } : {}),
        status: "success",
      }).sort({ createdAt: -1 });

      if (!payment) {
        return NextResponse.json(ResponseHelper.error("No successful payment found to resend receipt for", "NOT_FOUND"), { status: 404 });
      }

      const receipt = await Receipt.findOne({ payment: payment._id });

      const { EmailService } = await import("@/services/email/email.service");
      await EmailService.sendMail({
        to: parentEmail,
        subject: `Payment Receipt: ${receipt?.receiptNumber || "Official Receipt"} — TrueLern`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Payment Receipt Confirmation</h2>
            <p>Dear ${parentName},</p>
            <p>Thank you for your payment of <strong>$${(payment.amount / 100).toFixed(2)}</strong> for ${childName}.</p>
            <p>Receipt Number: <strong>${receipt?.receiptNumber || "Issued"}</strong></p>
            <p>Status: Confirmed & Settled</p>
          </div>
        `,
      });

      await ActivityLog.create({
        entity: "Lead",
        entityId: lead._id.toString(),
        action: "RESEND_PAYMENT_RECEIPT_EMAIL",
        details: `Resent payment confirmation receipt to ${parentEmail}`,
      }).catch(() => {});

      return NextResponse.json(ResponseHelper.success(`Payment receipt email resent to ${parentEmail}`));
    }

    return NextResponse.json(ResponseHelper.error("Invalid emailType", "VALIDATION_ERROR"), { status: 400 });
  })
);
