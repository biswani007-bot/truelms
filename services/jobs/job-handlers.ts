/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Job Handler Registration — Phase 36.6
 *
 * Central registration module for all persistent job handlers.
 * Imported once during application startup to wire event-driven
 * automation pipelines to the JobEngineService.
 */
import { JobEngineService } from "./job-engine.service";
import { PaymentAutomationService } from "../automation/payment-automation.service";
import { EnrollmentAutomationService } from "../automation/enrollment-automation.service";
import { AttendanceReconciliationService } from "./attendance-reconciliation.service";
import { DemoReconciliationService } from "../demo/demo-reconciliation.service";
import { EmailService } from "../email/email.service";
import { DemoSession } from "../../models/demo-session.model";
import { logger } from "../../utils/logger";

function formatSessionDateTime(dateInput: Date | string | undefined, timeZone = "UTC") {
  if (!dateInput) return { dateStr: "TBD", timeStr: "TBD" };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { dateStr: "TBD", timeStr: "TBD" };

  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone,
  });

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  });

  return { dateStr, timeStr };
}

let registered = false;

export function registerJobHandlers(): void {
  if (registered) return;
  registered = true;

  // ─── Payment + Enrollment Automation Chain ─────────────────────────────────

  // Payment.completed → Receipt generation + enrollment confirmation chain
  JobEngineService.registerHandler("event.Payment.completed", async (payload) => {
    const paymentId = payload.paymentId || payload.entityId;
    if (!paymentId) throw new Error("Missing paymentId in Payment.completed payload");
    await PaymentAutomationService.handlePaymentCompleted(paymentId);
  });

  // Enrollment.confirmed → Student provisioning + batch allocation + welcome email
  JobEngineService.registerHandler("event.Enrollment.confirmed", async (payload) => {
    const enrollmentId = payload.enrollmentId || payload.entityId;
    if (!enrollmentId) throw new Error("Missing enrollmentId in Enrollment.confirmed payload");
    await EnrollmentAutomationService.handleEnrollmentConfirmed(enrollmentId);
  });

  // ─── Live Class Reminders ──────────────────────────────────────────────────

  // reminder.class → Email reminder to student for upcoming live class
  JobEngineService.registerHandler("reminder.class", async (payload) => {
    const { email, studentName, classTitle, startDate, classId, duration = 45, timezone = "UTC" } = payload;
    if (!email || !classId) {
      throw new Error("Missing required fields (email, classId) in reminder.class payload");
    }

    const { dateStr, timeStr } = formatSessionDateTime(startDate, timezone);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://truelern.visital.in";

    const res = await EmailService.sendMail({
      to: email,
      subject: `Your Next TrueLern Live Class: "${classTitle || "Live Class"}"`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #059669;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">TrueLern LMS</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Live Class Reminder</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Upcoming Live Class</h2>
            <p style="margin: 0 0 20px 0; line-height: 1.5; color: #475569;">
              Dear ${studentName || "Student"},<br/>
              This is a reminder that your live class is starting shortly.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 0 0 24px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 120px;">Class:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${classTitle || "Live Class"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Date:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Start Time:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${timeStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Duration:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${duration} minutes</td>
                </tr>
              </table>
            </div>
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 0 0 24px 0; border-radius: 4px;">
              <strong style="color: #1e40af; font-size: 13px;">Access Information:</strong>
              <p style="margin: 4px 0 0 0; color: #1e3a8a; font-size: 13px; line-height: 1.4;">
                Your Join option will become available 15 minutes before the session in your Student Portal.
              </p>
            </div>
            <div style="text-align: center; margin: 28px 0 12px 0;">
              <a href="${appUrl}/student/live-classes" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Go to Student Portal
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            TrueLern Academy &bull; Automated System Notification &bull; Please do not reply
          </div>
        </div>
      `,
    });

    if (!res.success) {
      const err = new Error(res.error || "Failed to dispatch class reminder email via Brevo");
      (err as any).isTerminal = res.isTerminal;
      throw err;
    }

    logger.info(`[JobHandlers] Class reminder dispatched for classId=${classId} to ${email} (messageId: ${res.messageId})`);
  });

  // ─── Assignment Reminders ──────────────────────────────────────────────────

  // reminder.assignment → Email reminder to student for assignment due date
  JobEngineService.registerHandler("reminder.assignment", async (payload) => {
    const { email, studentName, title, dueDate, assignmentId } = payload;
    if (!email || !assignmentId) {
      throw new Error("Missing required fields (email, assignmentId) in reminder.assignment payload");
    }

    const dueDateFormatted = dueDate
      ? new Date(dueDate).toLocaleString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
      : "Tomorrow";

    await EmailService.sendMail({
      to: email,
      subject: `Assignment Due Tomorrow: "${title || "Assignment"}" — TrueLern`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 560px;">
          <h2 style="color: #d97706;">📝 Assignment Due Soon</h2>
          <p>Dear ${studentName || "Student"},</p>
          <p>This is a reminder that the following assignment is due in less than 24 hours:</p>
          <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <strong style="font-size: 1.1em;">${title || "Assignment"}</strong><br/>
            <span style="color: #6b7280;">⏰ Due: ${dueDateFormatted}</span>
          </div>
          <p>Please log in to your TrueLern portal to submit your assignment before the deadline.</p>
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
            This is an automated reminder from TrueLern LMS. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    logger.info(`[JobHandlers] Assignment reminder dispatched for assignmentId=${assignmentId} to ${email}`);
  });

  // ─── Attendance Reconciliation ─────────────────────────────────────────────

  // attendance.reconcile → Mark absent students, recalculate summaries for completed classes
  JobEngineService.registerHandler("attendance.reconcile", async () => {
    const result = await AttendanceReconciliationService.reconcileCompletedClasses();
    logger.info(`[JobHandlers] Attendance reconciliation completed: ${result.reconciledClasses} classes, ${result.updatedSummaries} summaries.`);
    return result;
  });

  // ─── Demo Lifecycle Automations ──────────────────────────────────────────────

  JobEngineService.registerHandler("demo.reconcile", async () => {
    const result = await DemoReconciliationService.reconcileCompletedDemos();
    logger.info(`[JobHandlers] Demo reconciliation completed: ${result.completedCount} completed, ${result.missedCount} missed.`);
    return result;
  });

  JobEngineService.registerHandler("demo.scheduled", async (payload) => {
    const {
      parentEmail,
      parentName,
      childName,
      programName,
      scheduledStart,
      scheduledEnd,
      duration = 45,
      demoCode,
      demoId,
      teacherName,
      timezone = "UTC",
    } = payload;
    if (!parentEmail) throw new Error("Missing parentEmail in demo.scheduled payload");

    const { dateStr, timeStr: startTimeStr } = formatSessionDateTime(scheduledStart, timezone);
    const endTime = scheduledEnd || (scheduledStart ? new Date(new Date(scheduledStart).getTime() + duration * 60000) : undefined);
    const { timeStr: endTimeStr } = formatSessionDateTime(endTime, timezone);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://truelern.visital.in";

    const res = await EmailService.sendMail({
      to: parentEmail,
      subject: `TrueLern Demo Session Confirmed: ${programName || "Demo"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #059669;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">TrueLern</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Demo Booking Confirmation</p>
          </div>
          <div style="padding: 32px;">
            <div style="display: inline-block; background: #dcfce7; color: #15803d; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px;">
              Booking Confirmed
            </div>
            <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Your Demo Session is Confirmed</h2>
            <p style="margin: 0 0 20px 0; line-height: 1.5; color: #475569;">
              Dear ${parentName || "Parent"},<br/>
              We are pleased to confirm that the demo session for <strong>${childName || "your child"}</strong> has been scheduled successfully.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 0 0 24px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 140px;">Student:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${childName || "Student"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Course / Program:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${programName || "Program"}</td>
                </tr>
                ${teacherName ? `
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Assigned Teacher:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${teacherName}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Demo Date:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Start Time:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${startTimeStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">End Time:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${endTimeStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Session Duration:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Reference Code:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 13px; color: #475569;">${demoCode || demoId || "N/A"}</td>
                </tr>
              </table>
            </div>
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 0 0 24px 0; border-radius: 4px;">
              <strong style="color: #1e40af; font-size: 13px;">Session Access:</strong>
              <p style="margin: 4px 0 0 0; color: #1e3a8a; font-size: 13px; line-height: 1.4;">
                Your Join option will become available 15 minutes before the session in your Parent Portal.
              </p>
            </div>
            <div style="text-align: center; margin: 28px 0 12px 0;">
              <a href="${appUrl}/parent/dashboard" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Go to Parent Portal
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            TrueLern Academy &bull; Automated Booking System &bull; Please do not reply
          </div>
        </div>
      `,
    });

    if (!res.success) {
      const err = new Error(res.error || "Failed to dispatch demo booking confirmation email via Brevo");
      (err as any).isTerminal = res.isTerminal;
      throw err;
    }

    logger.info(`[JobHandlers] demo.scheduled email sent to ${parentEmail} (messageId: ${res.messageId})`);
  });

  JobEngineService.registerHandler("demo.teacher_assigned", async (payload) => {
    const {
      demoId,
      teacherEmail,
      teacherName,
      childName,
      programName,
      scheduledStart,
      scheduledEnd,
      duration = 45,
      demoCode,
      timezone = "UTC",
    } = payload;
    if (!teacherEmail) throw new Error("Missing teacherEmail in demo.teacher_assigned payload");

    const { dateStr, timeStr: startTimeStr } = formatSessionDateTime(scheduledStart, timezone);
    const endTime = scheduledEnd || (scheduledStart ? new Date(new Date(scheduledStart).getTime() + duration * 60000) : undefined);
    const { timeStr: endTimeStr } = formatSessionDateTime(endTime, timezone);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://truelern.visital.in";

    const res = await EmailService.sendMail({
      to: teacherEmail,
      subject: `New Demo Session Assignment: ${programName || "Demo"} - ${childName || "Student"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #6366f1;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">TrueLern Faculty</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">New Demo Session Assigned</p>
          </div>
          <div style="padding: 32px;">
            <div style="display: inline-block; background: #e0e7ff; color: #4338ca; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px;">
              Assignment Confirmed
            </div>
            <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">You Have Been Assigned a Demo Session</h2>
            <p style="margin: 0 0 20px 0; line-height: 1.5; color: #475569;">
              Dear ${teacherName || "Instructor"},<br/>
              You have been assigned to conduct a live demonstration session for <strong>${childName || "a student"}</strong> in <strong>${programName || "the program"}</strong>.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 0 0 24px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 140px;">Student:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${childName || "Student"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Course / Program:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${programName || "Program"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Date:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Time:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${startTimeStr} &ndash; ${endTimeStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Duration:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Reference Code:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 13px; color: #475569;">${demoCode || demoId || "N/A"}</td>
                </tr>
              </table>
            </div>
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 0 0 24px 0; border-radius: 4px;">
              <strong style="color: #1e40af; font-size: 13px;">Instructor Instructions:</strong>
              <p style="margin: 4px 0 0 0; color: #1e3a8a; font-size: 13px; line-height: 1.4;">
                Your teaching room option will activate 15 minutes prior to the scheduled start in your Faculty Portal.
              </p>
            </div>
            <div style="text-align: center; margin: 28px 0 12px 0;">
              <a href="${appUrl}/teacher/live-classes" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Open Faculty Portal
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            TrueLern Academy &bull; Faculty Operations &bull; Please do not reply
          </div>
        </div>
      `,
    });

    if (!res.success) {
      const err = new Error(res.error || "Failed to dispatch teacher demo assignment email via Brevo");
      (err as any).isTerminal = res.isTerminal;
      throw err;
    }

    logger.info(`[JobHandlers] demo.teacher_assigned email sent to ${teacherEmail} (messageId: ${res.messageId})`);
  });

  JobEngineService.registerHandler("demo.reminder", async (payload) => {
    const {
      demoId,
      parentEmail,
      parentName,
      childName,
      programName,
      scheduledStart,
      duration = 45,
      timezone = "UTC",
    } = payload;
    if (!parentEmail) throw new Error("Missing parentEmail in demo.reminder payload");

    // ─── Suppression Guards: Check current state of DemoSession ──────────────
    if (demoId) {
      const demo = await DemoSession.findById(demoId);
      if (!demo || demo.isDeleted) {
        logger.info(`[JobHandlers] demo.reminder suppressed: DemoSession ${demoId} not found or deleted.`);
        return;
      }
      if (demo.status === "cancelled" || demo.status === "completed" || demo.status === "missed") {
        logger.info(`[JobHandlers] demo.reminder suppressed: DemoSession ${demoId} status is '${demo.status}'.`);
        return;
      }
      // If demo was rescheduled and start time differs
      if (scheduledStart && new Date(demo.scheduledStart).getTime() !== new Date(scheduledStart).getTime()) {
        logger.info(`[JobHandlers] demo.reminder suppressed: DemoSession ${demoId} was rescheduled to a new time.`);
        return;
      }
    }

    const { dateStr, timeStr } = formatSessionDateTime(scheduledStart, timezone);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://truelern.visital.in";

    const res = await EmailService.sendMail({
      to: parentEmail,
      subject: `Your TrueLern Demo Starts Soon: ${programName || "Demo"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #d97706;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">TrueLern</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Demo Session Reminder</p>
          </div>
          <div style="padding: 32px;">
            <div style="display: inline-block; background: #fef3c7; color: #b45309; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px;">
              Starting Soon
            </div>
            <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Your Demo Session Starts Soon</h2>
            <p style="margin: 0 0 20px 0; line-height: 1.5; color: #475569;">
              Dear ${parentName || "Parent"},<br/>
              This is a reminder that the demo session for <strong>${childName || "your child"}</strong> in <strong>${programName || "the program"}</strong> is scheduled to begin shortly.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 0 0 24px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 140px;">Student:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${childName || "Student"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Course / Program:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${programName || "Program"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Demo Date:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Start Time:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${timeStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Duration:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${duration} minutes</td>
                </tr>
              </table>
            </div>
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; margin: 0 0 24px 0; border-radius: 4px;">
              <strong style="color: #92400e; font-size: 13px;">Ready to Join:</strong>
              <p style="margin: 4px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.4;">
                Your Join option will become available 15 minutes before the session in your Parent Portal. We recommend logging in early so your child is ready to begin.
              </p>
            </div>
            <div style="text-align: center; margin: 28px 0 12px 0;">
              <a href="${appUrl}/parent/dashboard" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Go to Parent Portal
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            TrueLern Academy &bull; Automated Reminder System &bull; Please do not reply
          </div>
        </div>
      `,
    });

    if (!res.success) {
      const err = new Error(res.error || "Failed to dispatch demo reminder email via Brevo");
      (err as any).isTerminal = res.isTerminal;
      throw err;
    }

    logger.info(`[JobHandlers] demo.reminder email sent to ${parentEmail} (messageId: ${res.messageId})`);
  });

  JobEngineService.registerHandler("demo.completed", async (payload) => {
    const { parentEmail, parentName, childName, programName } = payload;
    if (!parentEmail) throw new Error("Missing parentEmail in demo.completed payload");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://truelern.visital.in";

    const res = await EmailService.sendMail({
      to: parentEmail,
      subject: `Demo Completed: ${programName || "TrueLern Demo"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #059669;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">TrueLern</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Demo Completed</p>
          </div>
          <div style="padding: 32px;">
            <div style="display: inline-block; background: #dcfce7; color: #15803d; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px;">
              Session Completed
            </div>
            <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Thank You for Attending!</h2>
            <p style="margin: 0 0 20px 0; line-height: 1.5; color: #475569;">
              Dear ${parentName || "Parent"},<br/>
              We hope you and <strong>${childName || "your child"}</strong> enjoyed the demo session.
            </p>
            <p style="margin: 0 0 24px 0; line-height: 1.5; color: #475569;">
              Your next step is to complete the enrollment process in the Parent Portal to secure your preferred batch and schedule.
            </p>
            <div style="text-align: center; margin: 28px 0 12px 0;">
              <a href="${appUrl}/parent/dashboard" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Complete Enrollment
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            TrueLern Academy &bull; Student Success Team &bull; Please do not reply
          </div>
        </div>
      `,
    });

    if (!res.success) {
      const err = new Error(res.error || "Failed to dispatch demo completed email via Brevo");
      (err as any).isTerminal = res.isTerminal;
      throw err;
    }

    logger.info(`[JobHandlers] demo.completed email sent to ${parentEmail} (messageId: ${res.messageId})`);
  });

  // enrollment.offer → Email enrollment offer & checkout link to parent
  JobEngineService.registerHandler("enrollment.offer", async (payload) => {
    const { parentEmail, parentName, childName, courseName, totalAmount, currency = "USD", checkoutUrl } = payload;
    if (!parentEmail) throw new Error("Missing parentEmail in enrollment.offer payload");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://truelern.visital.in";
    const targetUrl = checkoutUrl?.startsWith("http") ? checkoutUrl : `${appUrl}${checkoutUrl || "/parent/dashboard"}`;
    const formattedAmount = totalAmount ? `$${(totalAmount / 100).toFixed(2)} ${currency}` : "Competitive Tuition";

    const res = await EmailService.sendMail({
      to: parentEmail,
      subject: `Enrollment Open: Secure Your Child's Spot in ${courseName || "TrueLern Program"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #059669;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">TrueLern</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Official Enrollment Offer</p>
          </div>
          <div style="padding: 32px;">
            <div style="display: inline-block; background: #ecfdf5; color: #047857; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px;">
              Offer Ready
            </div>
            <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Complete Enrollment for ${childName || "Your Child"}</h2>
            <p style="margin: 0 0 20px 0; line-height: 1.5; color: #475569;">
              Dear ${parentName || "Parent"},<br/>
              Following your successful demo, the enrollment offer for <strong>${childName || "your child"}</strong> in <strong>${courseName || "the course"}</strong> is now ready.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 0 0 24px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Course:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${courseName || "Program"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Total Tuition:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #047857;">${formattedAmount}</td>
                </tr>
              </table>
            </div>
            <div style="text-align: center; margin: 28px 0 12px 0;">
              <a href="${targetUrl}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                Review Invoice & Complete Payment
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            TrueLern Academy &bull; Student Success Team &bull; Please do not reply
          </div>
        </div>
      `,
    });

    if (!res.success) {
      const err = new Error(res.error || "Failed to dispatch enrollment offer email via Brevo");
      (err as any).isTerminal = res.isTerminal;
      throw err;
    }
    logger.info(`[JobHandlers] enrollment.offer email sent to ${parentEmail} (messageId: ${res.messageId})`);
  });

  // payment.confirmation → Email payment confirmation to parent
  JobEngineService.registerHandler("payment.confirmation", async (payload) => {
    const { parentEmail, studentName, amount, receiptNumber, paymentDate, courseName } = payload;
    if (!parentEmail) throw new Error("Missing parentEmail in payment.confirmation payload");

    const res = await EmailService.sendMail({
      to: parentEmail,
      subject: `Payment Confirmed: Receipt #${receiptNumber || "N/A"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #059669;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">TrueLern</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Payment Confirmation</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px;">Payment Received Successfully</h2>
            <p style="color: #475569;">We have received your payment for ${studentName ? studentName + "'s" : "the"} enrollment in ${courseName || "the course"}.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Receipt #:</strong> ${receiptNumber || "N/A"}</p>
              <p style="margin: 4px 0;"><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(paymentDate || Date.now()).toLocaleDateString()}</p>
            </div>
            <p style="color: #64748b; font-size: 13px;">Your enrollment is now confirmed. Our academic team is preparing cohort and batch placements.</p>
          </div>
        </div>
      `,
    });

    if (!res.success) {
      const err = new Error(res.error || "Failed to dispatch payment confirmation email");
      (err as any).isTerminal = res.isTerminal;
      throw err;
    }
    logger.info(`[JobHandlers] payment.confirmation email sent to ${parentEmail} (messageId: ${res.messageId})`);
  });

  // receipt.notification → Email receipt notice to parent
  JobEngineService.registerHandler("receipt.notification", async (payload) => {
    const { parentEmail, receiptNumber, invoiceNumber, amount, date } = payload;
    if (!parentEmail) throw new Error("Missing parentEmail in receipt.notification payload");

    const res = await EmailService.sendMail({
      to: parentEmail,
      subject: `Official Receipt #${receiptNumber || "N/A"} — TrueLern`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
          <div style="background: #0f172a; padding: 24px 32px; border-bottom: 3px solid #059669;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">TrueLern</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Official Payment Receipt</p>
          </div>
          <div style="padding: 32px;">
            <p>Receipt <strong>#${receiptNumber}</strong> for Invoice <strong>#${invoiceNumber}</strong> has been issued.</p>
            <p>Amount: <strong>$${(amount / 100).toFixed(2)}</strong> on ${new Date(date || Date.now()).toLocaleDateString()}.</p>
            <p style="color: #64748b; font-size: 13px;">You can view and download your full PDF receipt anytime from the Parent Portal under Finance & Receipts.</p>
          </div>
        </div>
      `,
    });

    if (!res.success) {
      const err = new Error(res.error || "Failed to dispatch receipt notification email");
      (err as any).isTerminal = res.isTerminal;
      throw err;
    }
    logger.info(`[JobHandlers] receipt.notification email sent to ${parentEmail} (messageId: ${res.messageId})`);
  });

  logger.info("[JobHandlers] Registered: event.Payment.completed, event.Enrollment.confirmed, reminder.class, reminder.assignment, attendance.reconcile, demo.scheduled, demo.reminder, demo.completed, enrollment.offer, payment.confirmation, receipt.notification");
}
