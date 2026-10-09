/* eslint-disable @typescript-eslint/no-explicit-any */
import { attendanceRepository } from "../../repositories/attendance.repository";
import { AttendanceCalculationService } from "./attendance-calculation.service";
import { AttendanceSummary } from "../../models/attendance-summary.model";

export class AttendanceSummaryService {
  /**
   * Recalculates metrics for a student in a batch and saves the summary
   */
  static async refreshSummary(studentId: string, batchId: string): Promise<void> {
    const history = await attendanceRepository.findMany(
      { student: studentId, batch: batchId },
      { sort: "attendanceDate", order: "asc" } as any
    );

    const totalClasses = history.length;
    const presentCount = history.filter((h) => ["present", "left-early"].includes(h.status)).length;
    const lateCount = history.filter((h) => h.status === "late").length;
    const excusedCount = history.filter((h) => h.status === "excused").length;
    const absentCount = history.filter((h) => h.status === "absent" || h.status === "no-response").length;

    // percentage calculation
    const eligibleCount = presentCount + lateCount;
    const attendancePercentage = totalClasses > 0 ? Math.round((eligibleCount / totalClasses) * 100) : 0;

    // Streaks calculation
    const statuses = history.map((h) => h.status);
    const { currentStreak, longestStreak } = AttendanceCalculationService.calculateStreaks(statuses);

    await AttendanceSummary.findOneAndUpdate(
      { student: studentId, batch: batchId },
      {
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendancePercentage,
        currentStreak,
        longestStreak,
      },
      { upsert: true, new: true }
    );
  }
}
