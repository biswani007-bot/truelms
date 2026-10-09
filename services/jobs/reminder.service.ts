import mongoose from "mongoose";
import { LiveClass } from "../../models/live-class.model";
import { Assignment } from "../../models/assignment.model";
import { BatchStudent } from "../../models/batch-student.model";
import { JobEngineService } from "./job-engine.service";
import { EmailService } from "../email/email.service";
import { logger } from "../../utils/logger";

export class ReminderService {
  /**
   * Scan for live classes starting in the next 15-30 minutes and schedule idempotent reminders.
   */
  static async scheduleClassReminders(): Promise<number> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 10 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

    const upcomingClasses = await LiveClass.find({
      startDate: { $gte: windowStart, $lte: windowEnd },
      status: { $in: ["scheduled", "published"] },
      isDeleted: { $ne: true },
    }).populate("course").populate("batch");

    let scheduledCount = 0;
    for (const lc of upcomingClasses) {
      const batchStudents = await BatchStudent.find({
        batch: lc.batch,
        status: "active",
      }).populate({
        path: "student",
        populate: { path: "user", select: "email" },
      });

      for (const bs of batchStudents) {
        const student = bs.student as any;
        if (!student) continue;

        const email = student.email || student.user?.email;
        if (!email) continue;

        const idempotencyKey = `class-reminder-${lc._id}-${student._id}`;
        await JobEngineService.scheduleJob({
          jobType: "reminder.class",
          entityType: "LiveClass",
          entityId: lc._id.toString(),
          payload: {
            classId: lc._id.toString(),
            studentId: student._id.toString(),
            classTitle: lc.classTitle,
            startDate: lc.startDate,
            duration: lc.duration || 45,
            timezone: lc.timezone || "UTC",
            email,
            studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
          },
          idempotencyKey,
          priority: "high",
        });
        scheduledCount++;
      }
    }

    return scheduledCount;
  }

  /**
   * Scan for assignments due in the next 24 hours and schedule idempotent reminders.
   */
  static async scheduleAssignmentReminders(): Promise<number> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);

    const dueAssignments = await Assignment.find({
      dueDate: { $gte: windowStart, $lte: windowEnd },
      status: "published",
      isDeleted: { $ne: true },
    }).populate("batch");

    let scheduledCount = 0;
    for (const a of dueAssignments) {
      const batchStudents = await BatchStudent.find({
        batch: a.batch,
        status: "active",
      }).populate("student");

      for (const bs of batchStudents) {
        const student = bs.student as any;
        if (!student) continue;

        const idempotencyKey = `assignment-reminder-${a._id}-${student._id}`;
        await JobEngineService.scheduleJob({
          jobType: "reminder.assignment",
          entityType: "Assignment",
          entityId: a._id.toString(),
          payload: {
            assignmentId: a._id.toString(),
            studentId: student._id.toString(),
            title: a.title,
            dueDate: a.dueDate,
            email: student.email || "student@truelern.com",
            studentName: student.firstName,
          },
          idempotencyKey,
          priority: "normal",
        });
        scheduledCount++;
      }
    }

    return scheduledCount;
  }
}
