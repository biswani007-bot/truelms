/* eslint-disable @typescript-eslint/no-explicit-any */
import { attendanceRepository } from "../../repositories/attendance.repository";
import { attendanceTimelineRepository } from "../../repositories/attendance-timeline.repository";
import { AttendanceSummaryService } from "./attendance-summary.service";
import { Attendance } from "../../models/attendance.model";
import { LiveClass } from "../../models/live-class.model";

export class AttendanceService {
  /**
   * Mark individual student attendance
   */
  static async markAttendance(
    data: {
      liveClass: string;
      batch: string;
      student: string;
      teacher: string;
      status: string;
      checkInTime?: Date;
      checkOutTime?: Date;
      remarks?: string;
      attendanceDate?: Date | string;
    },
    userId?: string
  ) {
    const liveClassObj = await LiveClass.findById(data.liveClass);
    if (!liveClassObj) throw new Error("Live class profile not found");

    const effectiveDate = data.attendanceDate
      ? new Date(data.attendanceDate)
      : liveClassObj.startDate || new Date();

    const parts = effectiveDate.toISOString().split("T")[0].split("-").map(Number);
    const startOfDay = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999));

    // 1. Look for existing attendance record for this student and batch on this date
    let record = await Attendance.findOne({
      batch: data.batch,
      student: data.student,
      attendanceDate: { $gte: startOfDay, $lte: endOfDay },
    });

    // 2. Fallback to (liveClass, student) unique index check
    if (!record && data.liveClass) {
      record = await Attendance.findOne({
        liveClass: data.liveClass,
        student: data.student,
      });
    }

    if (record) {
      // Update existing record
      record.status = data.status as any;
      record.teacher = data.teacher as any;
      record.batch = data.batch as any;
      if (data.liveClass) record.liveClass = data.liveClass as any;
      record.attendanceDate = effectiveDate;
      if (data.checkInTime) record.checkInTime = data.checkInTime;
      if (data.checkOutTime) record.checkOutTime = data.checkOutTime;
      if (data.remarks !== undefined) record.remarks = data.remarks;
      await record.save();
    } else {
      // Insert new record with unique attendanceNumber
      const count = await Attendance.countDocuments({});
      const attendanceNumber = `ATT-${String(count + 1).padStart(5, "0")}`;
      record = await Attendance.create({
        attendanceNumber,
        liveClass: data.liveClass,
        batch: data.batch,
        student: data.student,
        teacher: data.teacher,
        attendanceDate: effectiveDate,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        status: data.status,
        remarks: data.remarks,
        mode: "teacher-marked",
      });
    }

    // Refresh summary
    await AttendanceSummaryService.refreshSummary(data.student, data.batch);

    await attendanceTimelineRepository.create({
      liveClass: data.liveClass as any,
      batch: data.batch as any,
      event: "attendance-marked",
      description: `Attendance marked for student: ${data.status}`,
      performedBy: userId as any,
    });

    return record;
  }

  /**
   * Bulk marks attendance for multiple students in a class
   */
  static async bulkMark(
    classId: string,
    batchId: string,
    teacherId: string,
    records: Array<{ student: string; status: string; remarks?: string }>,
    userId?: string,
    attendanceDate?: Date | string
  ) {
    const results = [];
    for (const r of records) {
      const res = await this.markAttendance(
        {
          liveClass: classId,
          batch: batchId,
          student: r.student,
          teacher: teacherId,
          status: r.status,
          remarks: r.remarks,
          attendanceDate: attendanceDate ? new Date(attendanceDate) : undefined,
        },
        userId
      );
      results.push(res);
    }
    return results;
  }
}
