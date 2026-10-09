import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withRoles } from "@/middleware/auth.middleware";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";
import { DemoSession } from "@/models/demo-session.model";
import { DemoAvailability } from "@/models/demo-availability.model";
import { Course } from "@/models/course.model";
import { Lead } from "@/models/lead.model";
import { Parent } from "@/models/parent.model";
import { Teacher } from "@/models/teacher.model";
import { Batch } from "@/models/batch.model";
import { BatchTeacher } from "@/models/batch-teacher.model";
import { Student } from "@/models/student.model";
import { ParentStudentLink } from "@/models/parent-student-link.model";
import { LiveClass } from "@/models/live-class.model";
import { JobEngineService } from "@/services/jobs/job-engine.service";
import { ResponseHelper } from "@/helpers/response";

/**
 * POST /api/crm/demos/schedule-for-child
 *
 * Admin action: Schedule a DemoSession for a specific child/parent + course + teacher + time slot.
 *
 * Body:
 *   leadId       — optional — CRM Lead ID to associate (finds parent/course from lead)
 *   parentId     — optional — override parent; derived from leadId if not provided
 *   studentId    — optional — override student; derived from parentId if not provided
 *   courseId     — required — Course ObjectId
 *   teacherId    — optional — Teacher ObjectId (resolved from course if omitted)
 *   scheduledStart — required — ISO 8601 datetime string
 *   duration     — optional — minutes (default: 45)
 *   notes        — optional
 */
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "operations-manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const body = await req.json();
    const {
      leadId,
      parentId: parentIdParam,
      studentId: studentIdParam,
      courseId,
      teacherId: teacherIdParam,
      scheduledStart,
      duration = 45,
      notes,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return NextResponse.json(ResponseHelper.error("Valid courseId is required"), { status: 400 });
    }
    if (!scheduledStart) {
      return NextResponse.json(ResponseHelper.error("scheduledStart is required"), { status: 400 });
    }

    const start = new Date(scheduledStart);
    if (isNaN(start.getTime())) {
      return NextResponse.json(ResponseHelper.error("Invalid scheduledStart datetime"), { status: 400 });
    }
    if (start <= new Date()) {
      return NextResponse.json(ResponseHelper.error("scheduledStart must be in the future"), { status: 400 });
    }

    const durationMin = Math.max(15, Number(duration) || 45);
    const end = new Date(start.getTime() + durationMin * 60000);

    // ── 1. Resolve Course ─────────────────────────────────────────────────────
    const course = await Course.findById(courseId);
    if (!course || (course as any).isDeleted) {
      return NextResponse.json(ResponseHelper.error("Course not found"), { status: 404 });
    }

    // ── 2. Resolve Lead ───────────────────────────────────────────────────────
    let lead: any = null;
    if (leadId && mongoose.isValidObjectId(leadId)) {
      lead = await Lead.findById(leadId);
    }

    // ── 3. Resolve Parent ─────────────────────────────────────────────────────
    let parent: any = null;
    if (parentIdParam && mongoose.isValidObjectId(parentIdParam)) {
      parent = await Parent.findById(parentIdParam);
    } else if (lead?.email) {
      parent = await Parent.findOne({ email: lead.email, isDeleted: { $ne: true } });
    }

    // ── 4. Resolve Student ────────────────────────────────────────────────────
    let student: any = null;
    if (studentIdParam && mongoose.isValidObjectId(studentIdParam)) {
      student = await Student.findById(studentIdParam);
      // Verify parent owns this student (if parent is known)
      if (parent && student) {
        const link = await ParentStudentLink.findOne({
          parent: parent._id,
          student: student._id,
          canAccessPortal: true,
          isDeleted: { $ne: true },
        });
        if (!link) {
          return NextResponse.json(
            ResponseHelper.error("The specified student is not authorized under the specified parent"),
            { status: 403 }
          );
        }
      }
    } else if (parent) {
      // Auto-resolve first linked child
      const link = await ParentStudentLink.findOne({
        parent: parent._id,
        canAccessPortal: true,
        isDeleted: { $ne: true },
      }).populate("student");
      if (link?.student) {
        student = link.student;
      }
    }

    // ── 5. Resolve Teacher ────────────────────────────────────────────────────
    let teacher: any = null;
    if (teacherIdParam && mongoose.isValidObjectId(teacherIdParam)) {
      teacher = await Teacher.findOne({
        _id: teacherIdParam,
        status: "active",
        isDeleted: { $ne: true },
      });
      if (!teacher) {
        return NextResponse.json(ResponseHelper.error("Selected teacher not found or is inactive"), { status: 404 });
      }
      const { DemoTeacherService } = await import("@/services/demo/demo-teacher.service");
      const { allEligibleTeachers } = await DemoTeacherService.resolveEligibleTeachersForCourse(course._id);
      const isEligible = allEligibleTeachers.some((t: any) => t._id.toString() === teacher._id.toString());
      if (!isEligible) {
        return NextResponse.json(
          ResponseHelper.error("Selected teacher is not configured as eligible demo faculty for this course"),
          { status: 400 }
        );
      }
    } else {
      const { DemoTeacherService } = await import("@/services/demo/demo-teacher.service");
      const selection = await DemoTeacherService.selectDemoTeacher(course._id, start, end);
      teacher = selection.teacher;
    }

    // ── 6. Conflict detection for teacher ─────────────────────────────────────
    if (teacher) {
      const [conflictDemo, conflictLiveClass] = await Promise.all([
        DemoSession.findOne({
          teacher: teacher._id,
          status: { $in: ["scheduled", "live"] },
          scheduledStart: { $lt: end },
          scheduledEnd: { $gt: start },
          isDeleted: { $ne: true },
        }),
        LiveClass.findOne({
          teacher: teacher._id,
          status: { $in: ["scheduled", "live"] },
          startDate: { $lt: end },
          endDate: { $gt: start },
          isDeleted: { $ne: true },
        }),
      ]);

      if (conflictDemo) {
        return NextResponse.json(
          ResponseHelper.error(
            `The selected teacher has a conflicting demo session (${conflictDemo.demoCode}) at this time`
          ),
          { status: 409 }
        );
      }
      if (conflictLiveClass) {
        return NextResponse.json(
          ResponseHelper.error(
            `The selected teacher has a conflicting live class at this time`
          ),
          { status: 409 }
        );
      }
    }

    // ── 7. Duplicate DemoSession guard ────────────────────────────────────────
    if (parent && student) {
      const existingDemo = await DemoSession.findOne({
        parent: parent._id,
        student: student._id,
        status: { $in: ["scheduled", "live"] },
        isDeleted: { $ne: true },
      });
      if (existingDemo) {
        return NextResponse.json(
          ResponseHelper.error(
            `An active demo session (${existingDemo.demoCode}) already exists for this child. Cancel it before creating a new one.`
          ),
          { status: 409 }
        );
      }
    }

    // ── 8. Create / Upsert Lead for CRM ──────────────────────────────────────
    if (!lead && parent) {
      lead = await Lead.findOne({ email: parent.email, isDeleted: { $ne: true } });
    }

    if (!lead) {
      const leadCount = await Lead.countDocuments();
      const leadId = `LED-${Date.now().toString().slice(-4)}${String(leadCount + 1).padStart(4, "0")}`;
      const studentName = student
        ? `${student.firstName} ${student.lastName}`.trim()
        : "Student";
      lead = await Lead.create({
        leadId,
        fullName: parent ? `${parent.firstName} ${parent.lastName}`.trim() : studentName,
        email: parent?.email || `unknown-${Date.now()}@truelern.com`,
        phone: parent?.phone || "0000000000",
        country: parent?.country || "USA",
        state: parent?.state || "Unknown",
        city: parent?.city || "Unknown",
        interestedCourse: (course as any).courseName,
        course: course._id,
        parent: parent?._id,
        student: student?._id,
        leadSource: "manual",
        learningMode: "live",
        priority: "high",
        status: "demo_scheduled",
      });
    } else {
      await Lead.findByIdAndUpdate(lead._id, {
        status: "demo_scheduled",
        interestedCourse: (course as any).courseName,
        course: course._id,
        ...(parent ? { parent: parent._id, fullName: `${parent.firstName} ${parent.lastName}`.trim() } : {}),
        ...(student ? { student: student._id } : {}),
      });
    }

    // ── 9. Create DemoSession ─────────────────────────────────────────────────
    const demoCode = `DEMO-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    const demo = await DemoSession.create({
      demoCode,
      lead: lead._id,
      parent: parent?._id,
      student: student?._id,
      teacher: teacher?._id,
      interestedCourse: (course as any).courseName,
      course: course._id,
      scheduledStart: start,
      scheduledEnd: end,
      duration: durationMin,
      meetingPlatform: "jitsi",
      meetingLink: "/parent/demo/join",
      status: "scheduled",
    });

    // Update Lead status
    await Lead.findByIdAndUpdate(lead._id, { status: "demo_scheduled" });

    // ── 10. Schedule email jobs ───────────────────────────────────────────────
    if (parent) {
      const parentName = `${parent.firstName || ""} ${parent.lastName || ""}`.trim();
      const childName = student
        ? `${student.firstName} ${student.lastName}`.trim()
        : "Your child";
      const parentTimezone =
        (parent as any).timezone || (parent as any).preferences?.timezone || "UTC";

      const teacherName = teacher
        ? `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()
        : undefined;

      // Confirmation email (immediate)
      await JobEngineService.scheduleJob({
        jobType: "demo.scheduled",
        entityType: "DemoSession",
        entityId: demo._id.toString(),
        payload: {
          demoId: demo._id.toString(),
          parentEmail: parent.email,
          parentName,
          childName,
          programName: (course as any).courseName,
          scheduledStart: demo.scheduledStart,
          scheduledEnd: demo.scheduledEnd,
          duration: durationMin,
          demoCode: demo.demoCode,
          teacherName,
          timezone: parentTimezone,
        },
        idempotencyKey: `demo-booking-confirm-${demo._id}`,
        priority: "high",
      });

      if (teacher) {
        const teacherDoc = await Teacher.findById(teacher._id).populate("user", "email");
        const teacherEmail = teacherDoc?.email || (teacherDoc?.user as any)?.email;
        if (teacherEmail && teacherDoc) {
          await JobEngineService.scheduleJob({
            jobType: "demo.teacher_assigned",
            entityType: "DemoSession",
            entityId: demo._id.toString(),
            payload: {
              demoId: demo._id.toString(),
              teacherEmail,
              teacherName: `${teacherDoc.firstName} ${teacherDoc.lastName}`.trim(),
              childName,
              programName: (course as any).courseName,
              scheduledStart: demo.scheduledStart,
              scheduledEnd: demo.scheduledEnd,
              duration: durationMin,
              demoCode: demo.demoCode,
            },
            priority: "high",
          });
        }
      }

      // T-25 reminder
      const reminderTime = new Date(demo.scheduledStart.getTime() - 25 * 60 * 1000);
      if (reminderTime > new Date()) {
        await JobEngineService.scheduleJob({
          jobType: "demo.reminder",
          entityType: "DemoSession",
          entityId: demo._id.toString(),
          payload: {
            demoId: demo._id.toString(),
            parentEmail: parent.email,
            parentName,
            childName,
            programName: (course as any).courseName,
            scheduledStart: demo.scheduledStart,
            duration: durationMin,
            demoCode: demo.demoCode,
            timezone: parentTimezone,
          },
          idempotencyKey: `demo-reminder-${demo._id}-${demo.scheduledStart.getTime()}`,
          priority: "normal",
          scheduledAt: reminderTime,
        });
      }

      // Process confirmation email immediately
      try {
        const { registerJobHandlers } = await import(
          "@/services/jobs/job-handlers"
        );
        registerJobHandlers();
        await JobEngineService.processNextJob();
      } catch (emailErr) {
        console.error("[schedule-for-child] Email dispatch error (non-fatal):", emailErr);
      }
    }

    return NextResponse.json(
      ResponseHelper.success("Demo session scheduled successfully", {
        demoId: demo._id,
        demoCode: demo.demoCode,
        courseId: course._id,
        courseName: (course as any).courseName,
        teacherId: teacher?._id,
        teacherName: teacher
          ? `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()
          : null,
        parentId: parent?._id,
        studentId: student?._id,
        scheduledStart: demo.scheduledStart,
        scheduledEnd: demo.scheduledEnd,
        duration: durationMin,
        status: demo.status,
      }),
      { status: 201 }
    );
  })
);
