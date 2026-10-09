import mongoose from "mongoose";
import { DemoSession, IDemoSession } from "../../models/demo-session.model";
import { Batch } from "../../models/batch.model";
import { BatchTeacher } from "../../models/batch-teacher.model";
import { Course } from "../../models/course.model";
import { Teacher, ITeacher } from "../../models/teacher.model";
import { User } from "../../models/user.model";
import { LiveClass } from "../../models/live-class.model";
import { ActivityLog } from "../../models/activity-log.model";
import { JobEngineService } from "../jobs/job-engine.service";
import { generateJitsiToken, JitsiTokenPayload } from "../../lib/jitsi/token";
import { ApiError } from "../../utils/api-error";
import { ERROR_CODES } from "../../constants/error-codes";

export interface DemoJoinEligibility {
  canJoin: boolean;
  reason: string;
  joinStart: Date;
  joinEnd: Date;
}

export interface TeacherAvailabilityCheck {
  available: boolean;
  reason?: string;
  conflictType?: "inactive" | "demo" | "live_class";
}

export interface DemoTeacherSelectionResult {
  teacher: any | null;
  selectionRole: "primary" | "eligible" | "backup" | "none";
  status: "assigned" | "assignment_required";
  reason: string;
}

export interface CourseFacultyAvailabilityItem {
  teacherId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  teacherCode?: string;
  employeeId?: string;
  email: string;
  role: "primary" | "eligible" | "backup";
  status: string;
  isAvailable: boolean;
  available: boolean;
  conflictReason?: string;
  reason?: string;
}

export class DemoTeacherService {
  /**
   * Retrieves all courses that this teacher is authorized to teach via:
   * 1. Direct Batch assignment (primaryTeacher, assistantTeacher, mentor)
   * 2. Active BatchTeacher assignment
   * 3. Direct Course instructors reference
   */
  static async getTeacherCourseIds(
    teacherId: string | mongoose.Types.ObjectId,
    teacherUserId?: string | mongoose.Types.ObjectId
  ): Promise<mongoose.Types.ObjectId[]> {
    const tId = new mongoose.Types.ObjectId(teacherId.toString());

    // 1. Direct batch assignments
    const directBatches = await Batch.find({
      $or: [
        { primaryTeacher: tId },
        { assistantTeacher: tId },
        { mentor: tId },
      ],
      isDeleted: { $ne: true },
    }).select("course");

    // 2. Active BatchTeacher records
    const batchTeachers = await BatchTeacher.find({
      teacher: tId,
      status: "active",
    }).select("batch");

    const batchIdsFromTeacher = batchTeachers.map((bt) => bt.batch);
    const assignedBatches =
      batchIdsFromTeacher.length > 0
        ? await Batch.find({
            _id: { $in: batchIdsFromTeacher },
            isDeleted: { $ne: true },
          }).select("course")
        : [];

    const courseIdSet = new Set<string>();

    for (const b of directBatches) {
      if (b.course) courseIdSet.add(b.course.toString());
    }
    for (const b of assignedBatches) {
      if (b.course) courseIdSet.add(b.course.toString());
    }

    // 3. Course instructors (if user ID is available)
    if (teacherUserId) {
      const uId = new mongoose.Types.ObjectId(teacherUserId.toString());
      const coursesWithInstructor = await Course.find({
        instructors: uId,
        isDeleted: { $ne: true },
      }).select("_id");
      for (const c of coursesWithInstructor) {
        courseIdSet.add(c._id.toString());
      }
    } else {
      // Look up user ID from Teacher profile
      const teacherDoc = await Teacher.findById(tId).select("user");
      if (teacherDoc?.user) {
        const coursesWithInstructor = await Course.find({
          instructors: teacherDoc.user,
          isDeleted: { $ne: true },
        }).select("_id");
        for (const c of coursesWithInstructor) {
          courseIdSet.add(c._id.toString());
        }
      }
    }

    return Array.from(courseIdSet).map((id) => new mongoose.Types.ObjectId(id));
  }

  /**
   * Retrieves DemoSessions visible and assigned to this teacher.
   * Includes:
   * - Demos directly assigned to this teacher (teacher: teacherId)
   * - Demos for this teacher's authorized courses where no conflicting teacher is assigned
   */
  /**
   * Retrieves DemoSessions visible and strictly assigned to this teacher.
   * Only returns sessions where teacher === teacherId.
   */
  static async getTeacherAssignedDemos(
    teacherId: string | mongoose.Types.ObjectId,
    teacherUserId?: string | mongoose.Types.ObjectId
  ): Promise<IDemoSession[]> {
    const tId = new mongoose.Types.ObjectId(teacherId.toString());

    const demos = await DemoSession.find({
      isDeleted: { $ne: true },
      teacher: tId,
    })
      .populate("student", "firstName lastName studentId")
      .populate("parent", "firstName lastName email phone")
      .populate("course", "courseName courseCode slug")
      .populate("teacher", "firstName lastName email")
      .sort({ scheduledStart: -1 });

    return demos;
  }

  /**
   * Verifies if a teacher is strictly authorized to access and conduct a specific DemoSession.
   * Authorization requires explicit assignment (demo.teacher === teacherId).
   */
  static async isTeacherAuthorizedForDemo(
    teacherId: string | mongoose.Types.ObjectId,
    demo: any,
    teacherUserId?: string | mongoose.Types.ObjectId
  ): Promise<boolean> {
    const tIdStr = teacherId.toString();

    // 1. Explicit Demo assignment
    if (demo.teacher) {
      const assignedTeacherId = demo.teacher._id
        ? demo.teacher._id.toString()
        : demo.teacher.toString();
      return assignedTeacherId === tIdStr;
    }

    // Phase 2 Rule: Without an explicit assigned teacher, no teacher can conduct the session as instructor
    return false;
  }

  /**
   * Resolves configured demo faculty for a Course.
   * Primary root is course.demoFaculty (primaryTeacher, eligibleTeachers, backupTeacher).
   * Falls back to course.instructors if demoFaculty is not yet configured.
   */
  static async resolveEligibleTeachersForCourse(
    courseId: string | mongoose.Types.ObjectId
  ): Promise<{
    primaryTeacher: any | null;
    eligibleTeachers: any[];
    backupTeacher: any | null;
    allEligibleTeachers: any[];
  }> {
    const course = await Course.findById(courseId);
    if (!course) {
      return {
        primaryTeacher: null,
        eligibleTeachers: [],
        backupTeacher: null,
        allEligibleTeachers: [],
      };
    }

    const teacherIdsToFetch: mongoose.Types.ObjectId[] = [];
    if (course.demoFaculty?.primaryTeacher) {
      teacherIdsToFetch.push(new mongoose.Types.ObjectId(course.demoFaculty.primaryTeacher.toString()));
    }
    if (course.demoFaculty?.eligibleTeachers?.length) {
      for (const tId of course.demoFaculty.eligibleTeachers) {
        teacherIdsToFetch.push(new mongoose.Types.ObjectId(tId.toString()));
      }
    }
    if (course.demoFaculty?.backupTeacher) {
      teacherIdsToFetch.push(new mongoose.Types.ObjectId(course.demoFaculty.backupTeacher.toString()));
    }

    // Fallback: If no demoFaculty configured, inspect course.instructors
    if (teacherIdsToFetch.length === 0 && course.instructors?.length) {
      const instructorTeachers = await Teacher.find({
        user: { $in: course.instructors },
        isDeleted: { $ne: true },
      });
      for (const t of instructorTeachers) {
        teacherIdsToFetch.push(t._id);
      }
    }

    const teachers = await Teacher.find({
      _id: { $in: teacherIdsToFetch },
      isDeleted: { $ne: true },
    }).populate("user", "email name");

    const teacherMap = new Map<string, any>();
    for (const t of teachers) {
      teacherMap.set(t._id.toString(), t);
    }

    const primaryTeacher = course.demoFaculty?.primaryTeacher
      ? teacherMap.get(course.demoFaculty.primaryTeacher.toString()) || null
      : null;

    const eligibleTeachers = (course.demoFaculty?.eligibleTeachers || [])
      .map((id: any) => teacherMap.get(id.toString()))
      .filter(Boolean);

    const backupTeacher = course.demoFaculty?.backupTeacher
      ? teacherMap.get(course.demoFaculty.backupTeacher.toString()) || null
      : null;

    // Unique ordered list of all eligible teachers
    const seen = new Set<string>();
    const allEligible: any[] = [];
    for (const t of [primaryTeacher, ...eligibleTeachers, backupTeacher, ...teachers]) {
      if (t && !seen.has(t._id.toString())) {
        seen.add(t._id.toString());
        allEligible.push(t);
      }
    }

    return {
      primaryTeacher,
      eligibleTeachers,
      backupTeacher,
      allEligibleTeachers: allEligible,
    };
  }

  /**
   * Checks whether a teacher is active and has no scheduling conflicts for the given time slot.
   */
  static async checkTeacherConflict(
    teacherId: string | mongoose.Types.ObjectId,
    start: Date | string,
    end: Date | string,
    excludeDemoId?: string | mongoose.Types.ObjectId
  ): Promise<TeacherAvailabilityCheck> {
    const tId = new mongoose.Types.ObjectId(teacherId.toString());
    const startDate = new Date(start);
    const endDate = new Date(end);

    const teacher = await Teacher.findOne({
      _id: tId,
      status: "active",
      isDeleted: { $ne: true },
    });

    if (!teacher) {
      return {
        available: false,
        reason: "Teacher is inactive, on leave, or not found",
        conflictType: "inactive",
      };
    }

    // 1. Check DemoSession conflicts (only active scheduled or live sessions)
    const demoQuery: any = {
      teacher: tId,
      status: { $in: ["scheduled", "live"] },
      isDeleted: { $ne: true },
      scheduledStart: { $lt: endDate },
      scheduledEnd: { $gt: startDate },
    };
    if (excludeDemoId && mongoose.isValidObjectId(excludeDemoId)) {
      demoQuery._id = { $ne: new mongoose.Types.ObjectId(excludeDemoId.toString()) };
    }

    const demoConflict = await DemoSession.findOne(demoQuery);
    if (demoConflict) {
      const timeStr = `${new Date(demoConflict.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(demoConflict.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      return {
        available: false,
        reason: `Conflict with booked Demo Session (${timeStr})`,
        conflictType: "demo",
      };
    }

    // 2. Check LiveClass conflicts (only active scheduled or live classes)
    const liveConflict = await LiveClass.findOne({
      teacher: tId,
      status: { $in: ["scheduled", "live"] },
      isDeleted: { $ne: true },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });
    if (liveConflict) {
      const timeStr = `${new Date(liveConflict.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(liveConflict.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      return {
        available: false,
        reason: `Conflict with Live Class "${liveConflict.classTitle}" (${timeStr})`,
        conflictType: "live_class",
      };
    }

    return { available: true };
  }

  /**
   * Deterministic, explainable smart selection algorithm for Demo Teachers:
   * 1. Primary Demo Teacher if eligible and available
   * 2. Other eligible course teachers (in order)
   * 3. Backup teacher if configured and eligible
   * 4. Otherwise: return null teacher with "Teacher Assignment Required" (NEVER assign Admin!)
   */
  static async selectDemoTeacher(
    courseId: string | mongoose.Types.ObjectId,
    start: Date,
    end: Date,
    excludeDemoId?: string | mongoose.Types.ObjectId
  ): Promise<DemoTeacherSelectionResult> {
    const { primaryTeacher, eligibleTeachers, backupTeacher, allEligibleTeachers } =
      await this.resolveEligibleTeachersForCourse(courseId);

    // 1. Primary Demo Teacher
    if (primaryTeacher) {
      const check = await this.checkTeacherConflict(primaryTeacher._id, start, end, excludeDemoId);
      if (check.available) {
        return {
          teacher: primaryTeacher,
          selectionRole: "primary",
          status: "assigned",
          reason: "Primary demo teacher assigned",
        };
      }
    }

    // 2. Additional Eligible Teachers
    for (const t of eligibleTeachers) {
      if (primaryTeacher && t._id.toString() === primaryTeacher._id.toString()) continue;
      const check = await this.checkTeacherConflict(t._id, start, end, excludeDemoId);
      if (check.available) {
        return {
          teacher: t,
          selectionRole: "eligible",
          status: "assigned",
          reason: "Eligible course demo teacher assigned",
        };
      }
    }

    // 3. Backup Teacher
    if (backupTeacher) {
      const alreadyChecked =
        (primaryTeacher && backupTeacher._id.toString() === primaryTeacher._id.toString()) ||
        eligibleTeachers.some((e: any) => e._id.toString() === backupTeacher._id.toString());
      if (!alreadyChecked) {
        const check = await this.checkTeacherConflict(backupTeacher._id, start, end, excludeDemoId);
        if (check.available) {
          return {
            teacher: backupTeacher,
            selectionRole: "backup",
            status: "assigned",
            reason: "Backup demo teacher assigned",
          };
        }
      }
    }

    // 4. Any other course instructors if available
    for (const t of allEligibleTeachers) {
      const alreadyTested =
        (primaryTeacher && t._id.toString() === primaryTeacher._id.toString()) ||
        eligibleTeachers.some((e: any) => e._id.toString() === t._id.toString()) ||
        (backupTeacher && t._id.toString() === backupTeacher._id.toString());
      if (!alreadyTested) {
        const check = await this.checkTeacherConflict(t._id, start, end, excludeDemoId);
        if (check.available) {
          return {
            teacher: t,
            selectionRole: "eligible",
            status: "assigned",
            reason: "Configured course instructor assigned",
          };
        }
      }
    }

    // 5. No eligible teacher available — Return operational state without Admin fallback!
    return {
      teacher: null,
      selectionRole: "none",
      status: "assignment_required",
      reason: "Teacher Assignment Required: No eligible teacher is currently available",
    };
  }

  /**
   * Retrieves all configured faculty for a Course and calculates their real-time availability.
   * Used by the Admin Demo Manual Assignment modal.
   */
  static async getCourseFacultyAvailability(
    courseId: string | mongoose.Types.ObjectId,
    start: Date,
    end: Date,
    excludeDemoId?: string | mongoose.Types.ObjectId
  ): Promise<CourseFacultyAvailabilityItem[]> {
    const course = await Course.findById(courseId);
    if (!course) return [];

    const { primaryTeacher, eligibleTeachers, backupTeacher, allEligibleTeachers } =
      await this.resolveEligibleTeachersForCourse(courseId);

    const items: CourseFacultyAvailabilityItem[] = [];
    const seen = new Set<string>();

    const evaluate = async (t: any, role: "primary" | "eligible" | "backup") => {
      if (!t || seen.has(t._id.toString())) return;
      seen.add(t._id.toString());

      const check = await this.checkTeacherConflict(t._id, start, end, excludeDemoId);
      const email = t.email || t.user?.email || "";
      const name = `${t.firstName || ""} ${t.lastName || ""}`.trim() || email || "Teacher";

      items.push({
        teacherId: t._id.toString(),
        name,
        firstName: t.firstName || "",
        lastName: t.lastName || "",
        teacherCode: t.teacherCode || t.employeeId || "",
        employeeId: t.employeeId || "",
        email,
        role,
        status: t.status || "active",
        isAvailable: check.available,
        available: check.available,
        conflictReason: check.reason,
        reason: check.reason,
      });
    };

    if (primaryTeacher) await evaluate(primaryTeacher, "primary");
    for (const t of eligibleTeachers) await evaluate(t, "eligible");
    if (backupTeacher) await evaluate(backupTeacher, "backup");
    for (const t of allEligibleTeachers) await evaluate(t, "eligible");

    return items;
  }

  /**
   * Assigns or reassigns an eligible teacher to an existing DemoSession.
   * Validates active status and conflicts. Updates DemoSession.teacher, logs activity,
   * and enqueues notification for the assigned teacher.
   */
  static async assignOrReassignDemoTeacher(
    demoId: string | mongoose.Types.ObjectId,
    teacherId: string | mongoose.Types.ObjectId,
    adminUserId: string,
    reason?: string,
    isReassignment: boolean = false
  ): Promise<any> {
    const demo = await DemoSession.findById(demoId)
      .populate("course")
      .populate("student")
      .populate("parent")
      .populate("lead");

    if (!demo || demo.isDeleted) {
      throw new ApiError(404, "Demo session not found", ERROR_CODES.NOT_FOUND);
    }

    const tId = new mongoose.Types.ObjectId(teacherId.toString());
    const teacher = await Teacher.findOne({
      _id: tId,
      status: "active",
      isDeleted: { $ne: true },
    }).populate("user", "email name");

    if (!teacher) {
      throw new ApiError(400, "Teacher not found or is currently inactive", ERROR_CODES.VALIDATION_ERROR);
    }

    // Verify eligibility strictly against the course's configured demo faculty
    if (demo.course) {
      const courseId = (demo.course as any)._id || demo.course;
      const { allEligibleTeachers } = await this.resolveEligibleTeachersForCourse(courseId);
      if (allEligibleTeachers.length === 0) {
        throw new ApiError(
          400,
          "No eligible demo faculty is configured for this course. Please configure Demo Faculty in Course Management first.",
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      const isEligible = allEligibleTeachers.some((t: any) => t._id.toString() === tId.toString());
      if (!isEligible) {
        // Teacher is not configured on this course's demo faculty
        throw new ApiError(
          400,
          `Teacher ${teacher.firstName} ${teacher.lastName} is not configured as eligible demo faculty for this course.`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // Check conflict for this teacher
    const conflictCheck = await this.checkTeacherConflict(tId, demo.scheduledStart, demo.scheduledEnd, demo._id);
    if (!conflictCheck.available) {
      throw new ApiError(
        400,
        `Cannot assign teacher: ${conflictCheck.reason}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const oldTeacherId = demo.teacher ? demo.teacher.toString() : null;
    demo.teacher = tId;
    await demo.save();

    // Record audit log
    try {
      await ActivityLog.create({
        user: mongoose.isValidObjectId(adminUserId) ? new mongoose.Types.ObjectId(adminUserId) : undefined,
        role: "admin",
        action: isReassignment ? "DEMO_TEACHER_REASSIGNED" : "DEMO_TEACHER_ASSIGNED",
        entity: "DemoSession",
        entityId: demo._id.toString(),
        metadata: {
          oldTeacherId,
          newTeacherId: tId.toString(),
          reason: reason || (isReassignment ? "Manual teacher reassignment by admin" : "Manual teacher assignment by admin"),
          demoCode: demo.demoCode,
          course: demo.course?._id,
        },
        timestamp: new Date(),
      });
    } catch (auditErr) {
      console.warn("[DemoTeacherService] Failed to record ActivityLog:", auditErr);
    }

    // Enqueue teacher assignment notification
    let teacherEmail = teacher.email;
    if (!teacherEmail && teacher.user) {
      if (typeof teacher.user === "object" && teacher.user.email) {
        teacherEmail = teacher.user.email;
      } else {
        const u = await User.findById(teacher.user).select("email");
        teacherEmail = u?.email;
      }
    }
    const teacherFullName = `${teacher.firstName} ${teacher.lastName}`.trim();
    const childFullName = demo.student ? `${(demo.student as any).firstName || ""} ${(demo.student as any).lastName || ""}`.trim() : "Student";
    const courseTitle = (demo.course as any)?.courseName || demo.interestedCourse || "Demo Course";

    if (teacherEmail) {
      try {
        await JobEngineService.scheduleJob({
          jobType: "demo.teacher_assigned",
          entityType: "DemoSession",
          entityId: demo._id.toString(),
          payload: {
            demoId: demo._id.toString(),
            teacherEmail,
            teacherName: teacherFullName,
            childName: childFullName,
            programName: courseTitle,
            scheduledStart: demo.scheduledStart,
            scheduledEnd: demo.scheduledEnd,
            duration: demo.duration || 45,
            demoCode: demo.demoCode,
          },
          priority: "high",
        });
      } catch (jobErr) {
        console.warn("[DemoTeacherService] Failed to enqueue demo.teacher_assigned job:", jobErr);
      }
    }

    return DemoSession.findById(demo._id)
      .populate("course", "courseName courseCode slug")
      .populate("student", "firstName lastName studentId")
      .populate("parent", "firstName lastName email phone")
      .populate("teacher", "firstName lastName email employeeId teacherCode status");
  }

  /**
   * Evaluates the T-15 join window rule for a DemoSession.
   * - Join window opens 15 minutes before scheduled start (T-15).
   * - Join window closes at scheduled end.
   */
  static getTeacherDemoJoinStatus(demo: any): DemoJoinEligibility {
    const now = new Date();
    const start = new Date(demo.scheduledStart);
    const end = new Date(demo.scheduledEnd);
    const joinStart = new Date(start.getTime() - 15 * 60000); // T-15

    if (demo.status === "completed") {
      return { canJoin: false, reason: "Session Completed", joinStart, joinEnd: end };
    }
    if (demo.status === "cancelled") {
      return { canJoin: false, reason: "Session Cancelled", joinStart, joinEnd: end };
    }
    if (demo.status === "missed") {
      return { canJoin: false, reason: "Session Missed", joinStart, joinEnd: end };
    }

    if (now < joinStart) {
      const diffMinutes = Math.ceil((joinStart.getTime() - now.getTime()) / 60000);
      return {
        canJoin: false,
        reason: `Opens at T-15 (in ${diffMinutes} min)`,
        joinStart,
        joinEnd: end,
      };
    }

    if (now > end) {
      return { canJoin: false, reason: "Session Concluded", joinStart, joinEnd: end };
    }

    return { canJoin: true, reason: "Ready to Join", joinStart, joinEnd: end };
  }

  /**
   * Generates a secure Jitsi moderator token for the teacher to conduct the DemoSession.
   * Strictly enforces:
   * 1. Teacher authorization
   * 2. T-15 window (rejects if now < scheduledStart - 15m or now > scheduledEnd)
   * 3. Role: moderator / instructor
   * 4. NO studentId is attached (preventing teacher participation from counting toward child completion)
   */
  static async generateTeacherDemoToken(
    teacher: any,
    demoId: string
  ): Promise<{ tokenPayload: JitsiTokenPayload; demo: any }> {
    if (!mongoose.isValidObjectId(demoId)) {
      throw new ApiError(400, "Invalid DemoSession ID", ERROR_CODES.VALIDATION_ERROR);
    }

    const demo = await DemoSession.findById(demoId)
      .populate("course", "courseName courseCode slug")
      .populate("student", "firstName lastName studentId")
      .populate("parent", "firstName lastName email phone");

    if (!demo || demo.isDeleted) {
      throw new ApiError(404, "Demo session not found", ERROR_CODES.NOT_FOUND);
    }

    // Verify teacher authorization
    const isAuthorized = await this.isTeacherAuthorizedForDemo(
      teacher._id,
      demo,
      teacher.user
    );

    if (!isAuthorized) {
      throw new ApiError(
        403,
        "Access Denied: You are not authorized to conduct this demo session.",
        ERROR_CODES.FORBIDDEN
      );
    }

    // Verify T-15 join window
    const eligibility = this.getTeacherDemoJoinStatus(demo);
    if (!eligibility.canJoin) {
      throw new ApiError(
        403,
        `Access Denied: ${eligibility.reason}`,
        ERROR_CODES.FORBIDDEN
      );
    }

    // Construct teacher name
    const teacherName =
      `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
      teacher.email ||
      "Faculty";

    // Generate Jitsi token using standard demo room format: truelern-demo-<demoId>
    // CRITICAL: isModerator = true, studentId = undefined
    const tokenPayload = generateJitsiToken(`demo-${demo._id}`, {
      id: teacher.user ? teacher.user.toString() : teacher._id.toString(),
      name: `Prof. ${teacherName}`,
      email: teacher.email || "",
      isModerator: true,
      // studentId MUST NOT BE PROVIDED
    });

    // If demo is currently "scheduled", mark it as "live"
    if (demo.status === "scheduled") {
      demo.status = "live";
      await demo.save();
    }

    return { tokenPayload, demo };
  }
}
