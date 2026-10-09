import mongoose from "mongoose";
import { Enrollment } from "../../models/enrollment.model";
import { Course } from "../../models/course.model";
import { BatchStudent } from "../../models/batch-student.model";

export interface CourseProgressDetail {
  studentId: string;
  courseId: string;
  progress: number;
  mode: "completion-telemetry" | "schedule-fallback";
  totalWeeks: number;
  elapsedWeeks: number;
  startDate?: string;
  status: string;
}

export class ProgressService {
  /**
   * getStudentCourseProgress(studentId, courseId)
   *
   * PROGRESS PRIORITY ARCHITECTURE:
   * 1. Actual Lesson/Module/Learning Completion Telemetry (if genuine completion telemetry exists)
   * 2. Existing Legitimate Progress Records (e.g. completed enrollment status)
   * 3. Schedule-Based Fallback (course duration weeks + actual enrollment / batch start date)
   *
   * SCHEDULE FALLBACK SPECIFICATION:
   * - Total duration weeks determined from Course duration (converted from weeks, months, or hours).
   * - Start date determined from active Batch start date (batchStart) or Enrollment date.
   * - Elapsed weeks = Math.max(0, (now - startDate) / (7 * 24 * 3600 * 1000)).
   * - Progress = Math.round((elapsedWeeks / totalWeeks) * 100).
   * - Strict Clamping: 0 <= progress <= 100. Never NaN, Infinity, or negative.
   * - Strict Child & Course Isolation: Enrollment must belong to the specified studentId and courseId.
   */
  static async getStudentCourseProgress(
    studentId: string | mongoose.Types.ObjectId,
    courseId: string | mongoose.Types.ObjectId
  ): Promise<number> {
    const detail = await this.getStudentCourseProgressDetail(studentId, courseId);
    return detail.progress;
  }

  /**
   * getStudentCourseProgressDetail(studentId, courseId)
   * Returns authoritative progress percentage and calculation metadata.
   */
  static async getStudentCourseProgressDetail(
    studentId: string | mongoose.Types.ObjectId,
    courseId: string | mongoose.Types.ObjectId
  ): Promise<CourseProgressDetail> {
    const sId = String(studentId);
    const cId = String(courseId);

    // Validate ObjectIds to prevent injection or CastErrors
    if (!mongoose.Types.ObjectId.isValid(sId) || !mongoose.Types.ObjectId.isValid(cId)) {
      return {
        studentId: sId,
        courseId: cId,
        progress: 0,
        mode: "schedule-fallback",
        totalWeeks: 0,
        elapsedWeeks: 0,
        status: "invalid-id",
      };
    }

    // 1. Strict Child & Course Scope Verification
    const enrollment = await Enrollment.findOne({
      student: new mongoose.Types.ObjectId(sId),
      course: new mongoose.Types.ObjectId(cId),
      isDeleted: { $ne: true },
    }).lean() as any;

    if (!enrollment) {
      return {
        studentId: sId,
        courseId: cId,
        progress: 0,
        mode: "schedule-fallback",
        totalWeeks: 0,
        elapsedWeeks: 0,
        status: "not-enrolled",
      };
    }

    // 2. Existing Legitimate Status Check
    // If enrollment is officially completed, return 100%
    if (enrollment.status === "completed") {
      return {
        studentId: sId,
        courseId: cId,
        progress: 100,
        mode: "completion-telemetry",
        totalWeeks: 0,
        elapsedWeeks: 0,
        status: "completed",
      };
    }

    // If enrollment is cancelled, refunded, or rejected, return 0%
    const validActiveStatuses = ["active", "confirmed", "learning-started", "batch-assigned"];
    if (!validActiveStatuses.includes(enrollment.status)) {
      return {
        studentId: sId,
        courseId: cId,
        progress: 0,
        mode: "schedule-fallback",
        totalWeeks: 0,
        elapsedWeeks: 0,
        status: enrollment.status || "inactive",
      };
    }

    // 3. Check for Genuine Lesson/Module Learning Completion Telemetry
    // Check if dynamic lesson/module progress collection exists in runtime models
    const lessonProgressModel = mongoose.models.LessonProgress || mongoose.models.StudentLessonProgress;
    if (lessonProgressModel) {
      const totalLessons = await (mongoose.models.CourseLesson || mongoose.models.Lesson)?.countDocuments({
        course: new mongoose.Types.ObjectId(cId),
        isDeleted: { $ne: true },
      }) || 0;

      if (totalLessons > 0) {
        const completedCount = await lessonProgressModel.countDocuments({
          student: new mongoose.Types.ObjectId(sId),
          course: new mongoose.Types.ObjectId(cId),
          status: "completed",
          isDeleted: { $ne: true },
        });

        const telemetryProgress = Math.min(100, Math.max(0, Math.round((completedCount / totalLessons) * 100)));
        return {
          studentId: sId,
          courseId: cId,
          progress: telemetryProgress,
          mode: "completion-telemetry",
          totalWeeks: 0,
          elapsedWeeks: 0,
          status: enrollment.status,
        };
      }
    }

    // 4. Schedule-Based Fallback
    // Determine course duration in weeks
    const course = await Course.findById(cId).lean() as any;
    let totalWeeks = 8; // Default standard cohort duration fallback

    if (course) {
      const durationVal = Number(course.duration);
      if (!isNaN(durationVal) && durationVal > 0) {
        if (course.durationUnit === "weeks") {
          totalWeeks = durationVal;
        } else if (course.durationUnit === "months") {
          totalWeeks = durationVal * 4;
        } else if (course.durationUnit === "hours") {
          // Average 4 instructional hours per cohort week
          totalWeeks = Math.max(1, Math.round(durationVal / 4));
        } else {
          totalWeeks = durationVal;
        }
      }
    }

    if (totalWeeks <= 0 || !isFinite(totalWeeks)) {
      totalWeeks = 8;
    }

    // Determine start date: Check active batch assignment first, then enrollmentDate
    const batchStudent = await BatchStudent.findOne({
      student: new mongoose.Types.ObjectId(sId),
      status: "active",
      isDeleted: { $ne: true },
    }).populate("batch").lean() as any;

    let startDate: Date | null = null;
    if (batchStudent?.batch) {
      const batchCourseId = String(batchStudent.batch.course?._id || batchStudent.batch.course);
      if (batchCourseId === cId && batchStudent.batch.batchStart) {
        const parsedBatchStart = new Date(batchStudent.batch.batchStart);
        if (!isNaN(parsedBatchStart.getTime())) {
          startDate = parsedBatchStart;
        }
      }
    }

    if (!startDate && enrollment.enrollmentDate) {
      const parsedEnrDate = new Date(enrollment.enrollmentDate);
      if (!isNaN(parsedEnrDate.getTime())) {
        startDate = parsedEnrDate;
      }
    }

    if (!startDate && enrollment.createdAt) {
      const parsedCreated = new Date(enrollment.createdAt);
      if (!isNaN(parsedCreated.getTime())) {
        startDate = parsedCreated;
      }
    }

    if (!startDate) {
      startDate = new Date();
    }

    const now = new Date();
    const diffTimeMs = now.getTime() - startDate.getTime();

    // Elapsed weeks (0 if course starts in the future)
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const elapsedWeeks = diffTimeMs > 0 ? diffTimeMs / msPerWeek : 0;

    const rawPercentage = (elapsedWeeks / totalWeeks) * 100;

    // Safety checks: Guard against NaN, Infinity, negative, and over 100
    let progress = 0;
    if (!isNaN(rawPercentage) && isFinite(rawPercentage)) {
      progress = Math.min(100, Math.max(0, Math.round(rawPercentage)));
    }

    return {
      studentId: sId,
      courseId: cId,
      progress,
      mode: "schedule-fallback",
      totalWeeks,
      elapsedWeeks: Math.round(elapsedWeeks * 100) / 100,
      startDate: startDate.toISOString(),
      status: enrollment.status,
    };
  }
}
