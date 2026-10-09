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
    },
    userId?: string
  ) {
    const liveClassObj = await LiveClass.findById(data.liveClass);
    if (!liveClassObj) throw new Error("Live class profile not found");

    const count = await attendanceRepository.findMany({}).then((res) => res.length);
    const attendanceNumber = `ATT-${String(count + 1).padStart(5, "0")}`;

    const record = await Attendance.findOneAndUpdate(
      { liveClass: data.liveClass, student: data.student },
      {
        $set: {
          attendanceNumber,
          batch: data.batch,
          teacher: data.teacher,
          attendanceDate: liveClassObj.startDate,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
          status: data.status,
          remarks: data.remarks,
        },
      },
      { upsert: true, new: true }
    );

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
    userId?: string
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
        },
        userId
      );
      results.push(res);
    }
    return results;
  }
}
