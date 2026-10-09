import mongoose from "mongoose";
import { LiveClass } from "../../models/live-class.model";
import { Attendance } from "../../models/attendance.model";
import { AttendanceSummary } from "../../models/attendance-summary.model";
import { BatchStudent } from "../../models/batch-student.model";
import { logger } from "../../utils/logger";

export class AttendanceReconciliationService {
  /**
   * Reconcile completed Live Classes by marking unrecorded students as absent and recalculating summaries.
   */
  static async reconcileCompletedClasses(): Promise<{ reconciledClasses: number; updatedSummaries: number }> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const completedClasses = await LiveClass.find({
      $or: [
        { status: "completed" },
        { endDate: { $lte: twoHoursAgo }, status: { $in: ["scheduled", "live"] } },
      ],
      isDeleted: { $ne: true },
    });

    let reconciledClasses = 0;
    const affectedStudents = new Set<string>();

    for (const lc of completedClasses) {
      if (lc.status !== "completed") {
        lc.status = "completed";
        await lc.save();
      }

      const batchStudents = await BatchStudent.find({ batch: lc.batch, status: "active" });

      for (const bs of batchStudents) {
        const studentId = bs.student.toString();
        affectedStudents.add(studentId);

        // Check if attendance record exists
        const existingAtt = await Attendance.findOne({
          liveClass: lc._id,
          student: bs.student,
        });

        if (!existingAtt) {
          const attendanceNumber = `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          await Attendance.create({
            attendanceNumber,
            liveClass: lc._id,
            batch: lc.batch,
            student: bs.student,
            teacher: lc.teacher,
            attendanceDate: lc.startDate,
            status: "absent",
            mode: "auto-sync",
            remarks: "Auto-reconciled absent: No classroom attendance logged.",
          });
        }
      }
      reconciledClasses++;
    }

    // Recalculate summaries for affected students
    let updatedSummaries = 0;
    for (const studentId of affectedStudents) {
      const records = await Attendance.find({ student: new (mongoose.Types.ObjectId as any)(studentId), isDeleted: { $ne: true } });
      const totalSessions = records.length;
      const presentCount = records.filter((r) => r.status === "present").length;
      const absentCount = records.filter((r) => r.status === "absent").length;
      const lateCount = records.filter((r) => r.status === "late").length;
      const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

      await AttendanceSummary.findOneAndUpdate(
        { student: new (mongoose.Types.ObjectId as any)(studentId) },
        {
          student: new (mongoose.Types.ObjectId as any)(studentId),
          totalSessions,
          presentCount,
          absentCount,
          lateCount,
          attendancePercentage,
          lastCalculatedAt: new Date(),
        },
        { upsert: true, returnDocument: "after" }
      );
      updatedSummaries++;
    }

    logger.info(`[AttendanceReconciliation] Reconciled ${reconciledClasses} classes, updated ${updatedSummaries} attendance summaries.`);
    return { reconciledClasses, updatedSummaries };
  }
}
