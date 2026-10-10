
/**
 * @swagger
 * /api/live-classes/{id}/token:
 *   post:
 *     summary: Auto-generated summary for POST /api/live-classes/{id}/token
 *     tags: [live-classes]
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../../../config/db";
import { JwtHelper } from "../../../../../helpers/jwt";
import { liveClassRepository } from "../../../../../repositories/live-class.repository";
import { teacherRepository } from "../../../../../repositories/teacher.repository";
import { studentRepository } from "../../../../../repositories/student.repository";
import { batchStudentRepository } from "../../../../../repositories/batch-student.repository";
import { BatchTeacher } from "../../../../../models/batch-teacher.model";
import { BatchStudent } from "../../../../../models/batch-student.model";
import { Enrollment } from "../../../../../models/enrollment.model";
import { Batch } from "../../../../../models/batch.model";
import { Parent } from "../../../../../models/parent.model";
import { ParentStudentLink } from "../../../../../models/parent-student-link.model";
import { generateJitsiToken } from "../../../../../lib/jitsi/token";
import { LiveClassAccessOverride } from "../../../../../models/live-class-access-override.model";
import { AttendanceRuleService } from "../../../../../services/attendance/attendance-rule.service";

/**
 * Canonical helper to verify whether a student is eligible to join a live class.
 * Follows TrueLern's canonical relationship chain:
 * 1. Batch assignment: Student is actively assigned to the live class's batch via BatchStudent,
 *    and the linked enrollment is not cancelled or refunded.
 * 2. Course enrollment: Student has an active enrollment for the live class's course,
 *    and is not actively assigned to a different batch for that same course.
 */
async function checkStudentClassEligibility(
  studentId: mongoose.Types.ObjectId | string,
  liveClass: any
): Promise<{ eligible: boolean; reason?: string; enrollment?: any; batchStudent?: any }> {
  const sId = typeof studentId === "string" ? new mongoose.Types.ObjectId(studentId) : studentId;
  const classStatus = (liveClass.status || "").toLowerCase();

  if (classStatus === "cancelled") {
    return { eligible: false, reason: "This live class session has been cancelled." };
  }
  if (classStatus === "archived") {
    return { eligible: false, reason: "This live class session is archived and unavailable." };
  }

  // Resolve the class's course ID
  let classCourseId = liveClass.course?._id ? liveClass.course._id.toString() : liveClass.course?.toString();
  const classBatchId = liveClass.batch?._id ? liveClass.batch._id.toString() : liveClass.batch?.toString();

  if (!classCourseId && classBatchId) {
    const batchDoc = await Batch.findById(classBatchId).select("course cohort");
    if (batchDoc?.course) {
      classCourseId = batchDoc.course.toString();
    }
  }

  // 1. Check Batch Assignment if the class has a batch
  if (classBatchId) {
    const batchStudent = await BatchStudent.findOne({
      batch: new mongoose.Types.ObjectId(classBatchId),
      student: sId,
      status: { $regex: /^active$/i },
      isDeleted: { $ne: true },
    }).populate("enrollment");

    if (batchStudent) {
      const enr = batchStudent.enrollment as any;
      if (enr && ["cancelled", "refunded", "rejected", "waiting-payment"].includes(enr.status)) {
        return {
          eligible: false,
          reason: `Student enrollment has status '${enr.status}', which does not permit live classroom access.`,
        };
      }
      return { eligible: true, batchStudent, enrollment: enr };
    }
  }

  // 2. Check Course Enrollment if class has an associated course
  if (classCourseId) {
    const validEnrollment = await Enrollment.findOne({
      student: sId,
      course: new mongoose.Types.ObjectId(classCourseId),
      status: { $in: ["confirmed", "batch-assigned", "learning-started", "active", "completed"] },
      isDeleted: { $ne: true },
    });

    if (validEnrollment) {
      // If the class has a batch, verify student is not actively assigned to a DIFFERENT batch for this same course
      if (classBatchId) {
        const otherBatchStudents = await BatchStudent.find({
          student: sId,
          batch: { $ne: new mongoose.Types.ObjectId(classBatchId) },
          status: { $regex: /^active$/i },
          isDeleted: { $ne: true },
        }).populate<{ batch: any }>("batch");

        const assignedToDifferentBatch = otherBatchStudents.some((bs) => {
          const bsCourseId = bs.batch?.course?._id ? bs.batch.course._id.toString() : bs.batch?.course?.toString();
          return bsCourseId === classCourseId;
        });

        if (assignedToDifferentBatch) {
          return {
            eligible: false,
            reason: "Access Denied: You are assigned to a different cohort/batch for this course.",
          };
        }
      }

      console.warn(
        `[LiveClass Access] Student ${sId} authorized via active course enrollment ${validEnrollment.enrollmentNumber} for course ${classCourseId}${classBatchId ? ` without specific BatchStudent record for batch ${classBatchId}` : ""}`
      );
      return { eligible: true, enrollment: validEnrollment };
    }

    // Check if there is an invalid/cancelled enrollment to provide a specific reason
    const invalidEnrollment = await Enrollment.findOne({
      student: sId,
      course: new mongoose.Types.ObjectId(classCourseId),
      isDeleted: { $ne: true },
    });

    if (invalidEnrollment) {
      return {
        eligible: false,
        reason: `Enrollment status is '${invalidEnrollment.status}', which does not permit live classroom access.`,
      };
    }
  }

  return {
    eligible: false,
    reason: "No active enrollment or cohort assignment found for this live class.",
  };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: classId } = await context.params;

    // 1. Authenticate user from cookie or bearer token
    const token =
      req.cookies.get("accessToken")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = JwtHelper.verifyAccess(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid or expired session token" },
        { status: 401 }
      );
    }

    // 2. Fetch LiveClass (or fallback to DemoSession)
    let liveClass = await liveClassRepository.findById(classId);
    if (!liveClass) {
      const cleanDemoId = classId.startsWith("demo-") ? classId.replace(/^demo-/, "") : classId;
      if (/^[0-9a-fA-F]{24}$/.test(cleanDemoId)) {
        const { DemoSession } = await import("../../../../../models/demo-session.model");
        const { DemoTeacherService } = await import("../../../../../services/demo/demo-teacher.service");
        const demo = await DemoSession.findById(cleanDemoId);
        if (demo && !demo.isDeleted) {
          const rawRoles = (decoded as any).roles || ((decoded as any).role ? [(decoded as any).role] : []);
          const roles = rawRoles.map((r: string) => (r || "").toLowerCase());
          const isTeacherRole = roles.some((r: string) => ["teacher", "instructor", "faculty", "coach"].includes(r));
          const isAdminRole = roles.some((r: string) => ["admin", "superadmin", "super-admin", "academic-manager", "operations-manager"].includes(r));

          if (!isTeacherRole && !isAdminRole) {
            return NextResponse.json(
              { error: "Access Denied: Only instructors can request a demo teacher token." },
              { status: 403 }
            );
          }

          let teacherDoc: any = await teacherRepository.findOne({ user: decoded.userId });
          if (!teacherDoc && isAdminRole) {
            teacherDoc = {
              _id: decoded.userId,
              user: decoded.userId,
              firstName: "Administrator",
              lastName: "",
              email: (decoded as any).email || "admin@truelern.com",
            };
          }

          if (!teacherDoc) {
            return NextResponse.json(
              { error: "Access Denied: Faculty profile not found." },
              { status: 403 }
            );
          }

          const { tokenPayload, demo: resolvedDemo } = await DemoTeacherService.generateTeacherDemoToken(
            teacherDoc,
            cleanDemoId
          );

          return NextResponse.json({
            success: true,
            data: {
              ...tokenPayload,
              liveClass: {
                id: resolvedDemo._id,
                title: `Demo: ${(resolvedDemo.student as any)?.firstName || "Student"} - ${(resolvedDemo.course as any)?.courseName || resolvedDemo.interestedCourse || "Demo"}`,
                scheduledAt: resolvedDemo.scheduledStart,
                duration: resolvedDemo.duration,
                agenda: "TrueLern Program Introduction Demo",
                status: resolvedDemo.status,
                recordingEnabled: false,
              },
            },
          });
        }
      }

      return NextResponse.json(
        { error: "Live class session not found" },
        { status: 404 }
      );
    }

    const rawRoles = (decoded as any).roles || ((decoded as any).role ? [(decoded as any).role] : []);
    const roles = rawRoles.map((r: string) => (r || "").toLowerCase());
    const isAdmin = roles.some((r: string) => ["admin", "superadmin", "super-admin", "super admin", "academic-manager", "operations-manager"].includes(r));
    const isTeacher = roles.some((r: string) => ["teacher", "instructor", "faculty"].includes(r));
    const isStudent = roles.some((r: string) => ["student", "learner"].includes(r));
    const isParent = roles.some((r: string) => ["parent", "guardian"].includes(r));

    let isModerator = false;
    let userName = (decoded as any).email || "Participant";
    let userEmail = (decoded as any).email || "";
    let authorizedStudentIds: any[] = [];

    if (isAdmin) {
      isModerator = true;
      userName = `Administrator (${userEmail || "Staff"})`;
    } else if (isTeacher) {
      // Resolve Teacher
      const teacher: any = await teacherRepository.findOne({ user: decoded.userId });
      if (!teacher) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 403 }
        );
      }

      // Verify batch / liveClass assignment
      const isDirectTeacher =
        (liveClass as any).teacher?.toString() === teacher._id.toString() ||
        (liveClass as any).assistantTeacher?.toString() === teacher._id.toString() ||
        (liveClass as any).mentor?.toString() === teacher._id.toString();

      let isAssignedBatchTeacher = false;
      if (!isDirectTeacher && (liveClass as any).batch) {
        const batchTeacher = await BatchTeacher.findOne({
          batch: (liveClass as any).batch,
          teacher: teacher._id,
          status: "active",
        });
        if (batchTeacher) isAssignedBatchTeacher = true;
      }

      if (!isDirectTeacher && !isAssignedBatchTeacher) {
        return NextResponse.json(
          {
            error:
              "Access Denied: You are not assigned to instruct this live classroom session.",
          },
          { status: 403 }
        );
      }

      isModerator = true;
      userName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.email || "Faculty";
      userEmail = teacher.email || "";
    } else if (isStudent) {
      // Resolve Student
      const student: any = await studentRepository.findOne({ user: decoded.userId });
      if (!student) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 403 }
        );
      }
      authorizedStudentIds = [student._id];

      // Canonical eligibility check
      const check = await checkStudentClassEligibility(student._id, liveClass);
      if (!check.eligible) {
        return NextResponse.json(
          {
            error: `Access Denied: ${check.reason || "You are not enrolled in the cohort assigned to this live class."}`,
          },
          { status: 403 }
        );
      }

      isModerator = false;
      userName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email || "Student";
      userEmail = student.email || "";
    } else if (isParent) {
      // Extract optional childId or studentId from query params or body (if supplied)
      let requestedChildId =
        req.nextUrl.searchParams.get("childId") ||
        req.nextUrl.searchParams.get("studentId");

      if (!requestedChildId) {
        try {
          const clonedReq = req.clone();
          const body = await clonedReq.json();
          requestedChildId = body?.childId || body?.studentId;
        } catch {
          // No body or unparseable JSON
        }
      }

      const parent = await Parent.findOne({
        user: decoded.userId,
        isDeleted: { $ne: true },
      });
      if (!parent) {
        return NextResponse.json({ error: "Parent profile not found" }, { status: 403 });
      }

      // Authoritative parent-student links query
      const links = await ParentStudentLink.find({
        parent: parent._id,
        canAccessPortal: { $ne: false },
        isDeleted: { $ne: true },
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: { $regex: /^active$/i } },
        ],
      }).populate("student");

      const linkedStudents = links
        .map((l: any) => l.student)
        .filter((s: any) => s && !s.isDeleted);

      if (linkedStudents.length === 0) {
        return NextResponse.json(
          { error: "Access Denied: No active linked children found for this parent account." },
          { status: 403 }
        );
      }

      // If a specific child was requested, enforce that the child belongs to this parent
      let candidateStudents = linkedStudents;
      if (requestedChildId) {
        const matchingStudent = linkedStudents.find(
          (s: any) =>
            s._id.toString() === requestedChildId ||
            s.studentId === requestedChildId
        );
        if (!matchingStudent) {
          return NextResponse.json(
            { error: "Access Denied: The requested child is not linked to your parent account." },
            { status: 403 }
          );
        }
        candidateStudents = [matchingStudent];
      }

      let authorizedStudent: any = null;
      let denialReason = "No linked child is enrolled in this live class.";

      for (const st of candidateStudents) {
        const check = await checkStudentClassEligibility(st._id, liveClass);
        if (check.eligible) {
          authorizedStudent = st;
          break;
        } else if (check.reason) {
          denialReason = check.reason;
        }
      }

      if (!authorizedStudent) {
        return NextResponse.json(
          { error: `Access Denied: ${denialReason}` },
          { status: 403 }
        );
      }

      authorizedStudentIds = [authorizedStudent._id];
      isModerator = false;
      const childName = `${authorizedStudent.firstName || ""} ${authorizedStudent.lastName || ""}`.trim() || authorizedStudent.email || "Child";
      userName = `Parent (${childName})`;
      userEmail = parent.email || (decoded as any).email || "";
    } else {
      return NextResponse.json(
        { error: "Access Denied: Role not authorized for live classroom access." },
        { status: 403 }
      );
    }

    // --- Enforce Join Window & Status Server-Side Rule ---
    if (!isAdmin && !isTeacher) { // Instructors can join anytime
      const classStatus = (liveClass.status || "").toLowerCase();
      if (classStatus === "cancelled") {
        return NextResponse.json(
          { error: "Access Denied: This live class session has been cancelled." },
          { status: 403 }
        );
      }
      if (classStatus === "archived") {
        return NextResponse.json(
          { error: "Access Denied: This live class session is archived and unavailable." },
          { status: 403 }
        );
      }
      if (classStatus === "completed") {
        return NextResponse.json(
          { error: "Access Denied: Session is already completed." },
          { status: 403 }
        );
      }

      if (liveClass.startDate) {
        const now = new Date();
        const start = new Date(liveClass.startDate);
        const diffMinutes = (start.getTime() - now.getTime()) / (1000 * 60);

        // Early join check
        if (diffMinutes > 15) {
          return NextResponse.json(
            { error: `Access Denied: You cannot join earlier than 15 minutes before the scheduled start time. (Scheduled for ${start.toLocaleTimeString()})` },
            { status: 403 }
          );
        }

        // Late join check (Normal Join Window)
        const minutesSinceStart = -diffMinutes;
        
        if (minutesSinceStart > 0) {
          // Get the permitted window
          const batchId = (liveClass as any).batch?.toString() || "global";
          const lateThreshold = await AttendanceRuleService.getRuleValue(batchId, "lateThreshold");
          const gracePeriod = await AttendanceRuleService.getRuleValue(batchId, "gracePeriod");
          const permittedWindowMinutes = lateThreshold + gracePeriod;

          if (minutesSinceStart > permittedWindowMinutes) {
            // After window -> check for override
            const override = await LiveClassAccessOverride.findOne({
               liveClass: (liveClass as any)._id,
               student: { $in: authorizedStudentIds },
               expiresAt: { $gt: now }
            });

            if (!override) {
               return NextResponse.json(
                 { error: `Access Denied: The permitted join window of ${permittedWindowMinutes} minutes after start time has expired. Please contact an administrator for a late-join override.` },
                 { status: 403 }
               );
            }
          }
        }
      }
    }
    // ------------------------------------------

    // 3. Generate Jitsi token
    const tokenPayload = generateJitsiToken(classId, {
      id: decoded.userId,
      name: userName,
      email: userEmail,
      isModerator,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tokenPayload,
        studentId: authorizedStudentIds[0]?.toString(),
        liveClass: {
          id: (liveClass as any)._id,
          title: (liveClass as any).title || (liveClass as any).classTitle,
          scheduledAt: (liveClass as any).scheduledAt || (liveClass as any).startDate,
          duration: (liveClass as any).durationMinutes || (liveClass as any).duration || 60,
          agenda: (liveClass as any).agenda || (liveClass as any).description,
          status: (liveClass as any).status,
          recordingEnabled: (liveClass as any).recordingEnabled ?? true,
        },
      },
    });
  } catch (error: any) {
    console.error("Failed to generate Jitsi classroom token:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
