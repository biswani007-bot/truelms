
/**
 * @swagger
 * /api/admin/system/jobs/trigger:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/system/jobs/trigger
 *     tags: [admin]
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

/**
 * @swagger
 * /api/admin/system/jobs/trigger:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/system/jobs/trigger
 *     tags: [admin]
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
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../config/db";
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { registerJobHandlers } from "../../../../../../services/jobs/job-handlers";
import { JobEngineService } from "../../../../../../services/jobs/job-engine.service";
import { ReminderService } from "../../../../../../services/jobs/reminder.service";
import { AttendanceReconciliationService } from "../../../../../../services/jobs/attendance-reconciliation.service";
import { logger } from "../../../../../../utils/logger";

/**
 * POST /api/admin/system/jobs/trigger
 *
 * Production background job trigger endpoint.
 * Designed to be called by:
 * 1. aaPanel's scheduled task / cron job (every 1-5 minutes)
 * 2. The Admin UI Jobs panel for manual execution
 *
 * Operations performed:
 * 1. Recover stale lease (stuck running jobs)
 * 2. Register all job handlers (idempotent — safe to call repeatedly)
 * 3. Process up to 20 pending/retrying jobs from the queue
 * 4. Schedule class reminders (10-30 min window)
 * 5. Schedule assignment reminders (20-28 hour window)
 * 6. Reconcile completed live class attendance
 *
 * Security: Admin/Super Admin only. Idempotent and safe to call repeatedly.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();

  // Custom Authentication: Allow either CRON_SECRET or Admin JWT
  const cronSecret = req.headers.get("x-cron-secret");
  const validCron = process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;
  
  if (!validCron) {
    const { verifyAuth } = await import("../../../../../../middleware/auth.middleware");
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json(ResponseHelper.error("Unauthorized", "UNAUTHORIZED"), { status: 401 });
    }
    const role = (user.role || "").toLowerCase().replace(/[-_ ]/g, "");
    if (!["admin", "superadmin"].includes(role)) {
      return NextResponse.json(ResponseHelper.error("Forbidden", "FORBIDDEN"), { status: 403 });
    }
  }

  const startTime = Date.now();
  const summary: Record<string, number | string> = {};

    try {
      // 1. Recover stale leases first (unlock jobs stuck in 'running' with expired lease)
      const recoveredLeases = await JobEngineService.recoverStaleLeases();
      summary.recoveredStaleLeases = recoveredLeases;

      // 2. Register all handlers (idempotent — safe to call every request)
      registerJobHandlers();

      // 3. Process queued jobs (payment automation, enrollment automation, reminders)
      const jobsProcessed = await JobEngineService.runBatch(20);
      summary.jobsProcessed = jobsProcessed;

      // 4. Schedule live class reminders for classes starting in 10-30 min
      try {
        const classRemindersScheduled = await ReminderService.scheduleClassReminders();
        summary.classRemindersScheduled = classRemindersScheduled;
      } catch (reminderErr: any) {
        logger.warn(`[JobTrigger] Class reminder scheduling error: ${reminderErr.message}`);
        summary.classRemindersScheduled = "error";
      }

      // 5. Schedule assignment reminders for assignments due in 20-28 hours
      try {
        const assignmentRemindersScheduled = await ReminderService.scheduleAssignmentReminders();
        summary.assignmentRemindersScheduled = assignmentRemindersScheduled;
      } catch (reminderErr: any) {
        logger.warn(`[JobTrigger] Assignment reminder scheduling error: ${reminderErr.message}`);
        summary.assignmentRemindersScheduled = "error";
      }

      // 6. Reconcile attendance for completed live classes
      try {
        const reconciliation = await AttendanceReconciliationService.reconcileCompletedClasses();
        summary.attendanceClassesReconciled = reconciliation.reconciledClasses;
        summary.attendanceSummariesUpdated = reconciliation.updatedSummaries;
      } catch (reconcileErr: any) {
        logger.warn(`[JobTrigger] Attendance reconciliation error: ${reconcileErr.message}`);
        summary.attendanceClassesReconciled = "error";
      }

      summary.durationMs = Date.now() - startTime;

      logger.info(`[JobTrigger] Job trigger completed: ${JSON.stringify(summary)}`);

      return NextResponse.json(
        ResponseHelper.success("Background job batch completed successfully", summary),
        { status: 200 }
      );
    } catch (err: any) {
      logger.error(`[JobTrigger] Critical job trigger failure: ${err.message}`);
      return NextResponse.json(
        ResponseHelper.error(`Job trigger failed: ${err.message}`, "JOB_TRIGGER_ERROR"),
        { status: 500 }
      );
    }
  });

/**
 * GET /api/admin/system/jobs/trigger
 *
 * Health check — returns basic status without executing jobs.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  // Custom Authentication: Allow either CRON_SECRET or Admin JWT
  const cronSecret = req.headers.get("x-cron-secret");
  const validCron = process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;
  
  if (!validCron) {
    const { verifyAuth } = await import("../../../../../../middleware/auth.middleware");
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json(ResponseHelper.error("Unauthorized", "UNAUTHORIZED"), { status: 401 });
    }
    const role = (user.role || "").toLowerCase().replace(/[-_ ]/g, "");
    if (!["admin", "superadmin"].includes(role)) {
      return NextResponse.json(ResponseHelper.error("Forbidden", "FORBIDDEN"), { status: 403 });
    }
  }

  const { Job } = await import("../../../../../../models/job.model");

  const [pending, retrying, running, failed, completed] = await Promise.all([
    Job.countDocuments({ status: "pending", isDeleted: { $ne: true } }),
    Job.countDocuments({ status: "retrying", isDeleted: { $ne: true } }),
    Job.countDocuments({ status: "running", isDeleted: { $ne: true } }),
    Job.countDocuments({ status: "failed", isDeleted: { $ne: true } }),
    Job.countDocuments({ status: "completed", isDeleted: { $ne: true } }),
  ]);

  return NextResponse.json(
    ResponseHelper.success("Job queue status retrieved", {
      queue: { pending, retrying, running, failed, completed },
      timestamp: new Date().toISOString(),
    }),
    { status: 200 }
  );
});
