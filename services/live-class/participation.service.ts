import mongoose from "mongoose";
import { LiveClass } from "../../models/live-class.model";
import { Attendance } from "../../models/attendance.model";
import { AttendanceTimeline } from "../../models/attendance-timeline.model";
import { Parent } from "../../models/parent.model";
import { ParentStudentLink } from "../../models/parent-student-link.model";
import { Student } from "../../models/student.model";
import { BatchStudent } from "../../models/batch-student.model";
import { AttendanceCalculationService } from "../attendance/attendance-calculation.service";
import { AttendanceSummaryService } from "../attendance/attendance-summary.service";
import { AttendanceSessionService } from "../attendance/attendance-session.service";
import { LiveClassTimeline } from "../../models/live-class-timeline.model";
import { Teacher } from "../../models/teacher.model";
import { ApiError } from "../../utils/api-error";
import { ERROR_CODES } from "../../constants/error-codes";

export interface ParticipationPayload {
  event: "joined" | "heartbeat" | "left";
  studentId?: string;
  durationSeconds?: number;
}

export class ParticipationService {
  /**
   * Authoritatively records genuine live classroom participation.
   * Resolves:
   * Parent → ParentStudentLink (canAccessPortal === true) → Child → BatchStudent (active) → LiveClass
   * or Student → BatchStudent (active) → LiveClass
   */
  static async recordParticipation(
    userId: string,
    roles: string[],
    classId: string,
    payload: ParticipationPayload
  ) {
    if (!mongoose.isValidObjectId(classId)) {
      throw new ApiError(400, "Invalid LiveClass ID", ERROR_CODES.VALIDATION_ERROR);
    }

    const liveClass = await LiveClass.findById(classId);
    if (!liveClass || liveClass.isDeleted) {
      throw new ApiError(404, "Live class session not found", ERROR_CODES.NOT_FOUND);
    }

    if (liveClass.status === "cancelled") {
      throw new ApiError(400, "Cannot record attendance: Live class is cancelled", ERROR_CODES.VALIDATION_ERROR);
    }

    const normalizedRoles = roles.map((r) => (r || "").toLowerCase());
    const isParent = normalizedRoles.some((r) => ["parent", "guardian"].includes(r));
    const isStudent = normalizedRoles.some((r) => ["student", "learner"].includes(r));
    const isTeacher = normalizedRoles.some((r) => ["teacher", "faculty"].includes(r));
    const isAdmin = normalizedRoles.some((r) => ["admin", "superadmin", "academic-manager"].includes(r));

    let targetStudentId: mongoose.Types.ObjectId | null = null;
    let observerNote = "";

    if (isParent) {
      const parent = await Parent.findOne({
        user: new mongoose.Types.ObjectId(userId),
        status: { $in: ["active", "approved"] },
        isDeleted: { $ne: true },
      });

      if (!parent) {
        throw new ApiError(403, "Access denied: No active parent profile found", ERROR_CODES.FORBIDDEN);
      }

      // If client provided a studentId, strictly validate it against ParentStudentLink & BatchStudent
      if (payload.studentId) {
        if (!mongoose.isValidObjectId(payload.studentId)) {
          throw new ApiError(400, "Invalid student ID", ERROR_CODES.VALIDATION_ERROR);
        }
        const sId = new mongoose.Types.ObjectId(payload.studentId);

        const link = await ParentStudentLink.findOne({
          parent: parent._id,
          student: sId,
          canAccessPortal: true,
          isDeleted: { $ne: true },
        });

        if (!link) {
          throw new ApiError(403, "Access denied: Unauthorized student for this parent", ERROR_CODES.FORBIDDEN);
        }

        const enrollment = await BatchStudent.findOne({
          batch: liveClass.batch,
          student: sId,
          status: "active",
          isDeleted: { $ne: true },
        });

        if (!enrollment) {
          throw new ApiError(403, "Access denied: Student is not actively enrolled in this cohort", ERROR_CODES.FORBIDDEN);
        }

        targetStudentId = sId;
      } else {
        // Fallback: Find authorized linked child enrolled in this batch
        const links = await ParentStudentLink.find({
          parent: parent._id,
          canAccessPortal: true,
          isDeleted: { $ne: true },
        });

        const linkedStudentIds = links.map((l) => l.student);
        const enrollment = await BatchStudent.findOne({
          batch: liveClass.batch,
          student: { $in: linkedStudentIds },
          status: "active",
          isDeleted: { $ne: true },
        });

        if (!enrollment) {
          throw new ApiError(403, "Access denied: None of your linked children are enrolled in this live class", ERROR_CODES.FORBIDDEN);
        }

        targetStudentId = enrollment.student as mongoose.Types.ObjectId;
      }

      observerNote = " (Parent Guardian Observer Session)";
    } else if (isStudent) {
      const student = await Student.findOne({
        user: new mongoose.Types.ObjectId(userId),
        isDeleted: { $ne: true },
      });

      if (!student) {
        throw new ApiError(403, "Access denied: Student profile not found", ERROR_CODES.FORBIDDEN);
      }

      const enrollment = await BatchStudent.findOne({
        batch: liveClass.batch,
        student: student._id,
        status: "active",
        isDeleted: { $ne: true },
      });

      if (!enrollment) {
        throw new ApiError(403, "Access denied: You are not enrolled in this cohort", ERROR_CODES.FORBIDDEN);
      }

      targetStudentId = student._id as mongoose.Types.ObjectId;
    } else if (isTeacher) {
      const teacher = await Teacher.findOne({
        user: new mongoose.Types.ObjectId(userId),
        isDeleted: { $ne: true },
      });

      if (!teacher) {
        throw new ApiError(403, "Access denied: Teacher profile not found", ERROR_CODES.FORBIDDEN);
      }

      // Log teacher timeline event for audit
      const eventMapping = {
        "joined": "teacher-joined",
        "left": "teacher-left",
        "heartbeat": "teacher-heartbeat"
      } as const;

      const timelineEvent = eventMapping[payload.event] || "teacher-heartbeat";
      
      await LiveClassTimeline.create({
        liveClass: liveClass._id,
        batch: liveClass.batch,
        event: timelineEvent,
        description: `Teacher ${payload.event} live session`,
        performedBy: new mongoose.Types.ObjectId(userId),
      });

      // Automatically open attendance session if Teacher joins
      if (payload.event === "joined") {
        await AttendanceSessionService.openSession(
          liveClass._id.toString(),
          liveClass.batch.toString(),
          userId
        ).catch((err) => {
          console.warn("Could not auto-open attendance session:", err.message);
        });
      }

      return {
        status: "acknowledged",
        role: "teacher",
        message: `Teacher ${payload.event} acknowledged`,
      };
    } else if (isAdmin) {
      // Admins joining do not create student attendance
      return {
        status: "acknowledged",
        role: "admin",
        message: "Admin presence acknowledged without student attendance mutation",
      };
    } else {
      throw new ApiError(403, "Role not authorized to record live class participation", ERROR_CODES.FORBIDDEN);
    }

    if (!targetStudentId) {
      throw new ApiError(400, "Could not resolve valid student for participation", ERROR_CODES.VALIDATION_ERROR);
    }

    const now = new Date();
    const batchIdStr = liveClass.batch.toString();
    const studentIdStr = targetStudentId.toString();

    // Idempotent search for existing attendance record
    let attendance = await Attendance.findOne({
      liveClass: liveClass._id,
      student: targetStudentId,
    });

    const isTeacherMarked = attendance && ["teacher-marked", "manual"].includes(attendance.mode);

    if (!attendance) {
      // First verified join: Create initial record
      const count = await Attendance.countDocuments();
      const attendanceNumber = `ATT-${String(count + 1).padStart(5, "0")}`;

      // Calculate initial status based on check-in time relative to class start
      const calculatedStatus = await AttendanceCalculationService.calculateStatus(
        batchIdStr,
        liveClass.startDate,
        now,
        0,
        liveClass.duration || 60
      );

      attendance = await Attendance.create({
        attendanceNumber,
        liveClass: liveClass._id,
        batch: liveClass.batch,
        student: targetStudentId,
        teacher: liveClass.teacher,
        attendanceDate: liveClass.startDate,
        checkInTime: now,
        checkOutTime: now,
        durationAttended: 0,
        status: calculatedStatus,
        mode: "auto-sync",
        remarks: `Verified participation via TrueLern classroom engine${observerNote}`,
      });

      await AttendanceTimeline.create({
        liveClass: liveClass._id,
        batch: liveClass.batch,
        event: "attendance-marked",
        description: `Verified attendance registered: ${calculatedStatus}${observerNote}`,
        performedBy: new mongoose.Types.ObjectId(userId),
      });
    } else {
      // Update existing attendance record
      if (!attendance.checkInTime) {
        attendance.checkInTime = now;
      }
      attendance.checkOutTime = now;

      // Calculate accumulated duration
      const durationSeconds = payload.durationSeconds || (payload.event === "heartbeat" ? 30 : 0);
      const elapsedMinutes = Math.round((now.getTime() - attendance.checkInTime.getTime()) / 60000);
      const newDuration = Math.max(attendance.durationAttended || 0, elapsedMinutes, Math.round(durationSeconds / 60));
      attendance.durationAttended = newDuration;

      // Only recalculate status if NOT manually marked by teacher
      if (!isTeacherMarked) {
        const updatedStatus = await AttendanceCalculationService.calculateStatus(
          batchIdStr,
          liveClass.startDate,
          attendance.checkInTime,
          newDuration,
          liveClass.duration || 60
        );

        attendance.status = updatedStatus;
        if (attendance.mode !== "auto-sync") {
          attendance.mode = "auto-sync";
        }
      }

      await attendance.save();
    }

    // Recalculate AttendanceSummary
    await AttendanceSummaryService.refreshSummary(studentIdStr, batchIdStr);

    return {
      success: true,
      attendanceId: attendance._id,
      status: attendance.status,
      mode: attendance.mode,
      durationAttended: attendance.durationAttended,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
    };
  }
}
