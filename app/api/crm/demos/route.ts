import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withRoles } from "../../../../middleware/auth.middleware";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { DemoSession } from "../../../../models/demo-session.model";
import { Course } from "../../../../models/course.model";
import { Lead } from "../../../../models/lead.model";
import { Parent } from "../../../../models/parent.model";
import { Batch } from "../../../../models/batch.model";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { ResponseHelper } from "../../../../helpers/response";

// GET all demo sessions
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "operations-manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const demos = await DemoSession.find({ isDeleted: { $ne: true } })
      .populate("course", "courseName courseCode slug")
      .populate("parent", "firstName lastName email phone")
      .populate("student", "firstName lastName studentCode")
      .populate("lead", "fullName email phone status")
      .populate("teacher", "firstName lastName email teacherCode")
      .sort({ scheduledStart: -1 });

    return NextResponse.json(ResponseHelper.success("Demos fetched successfully", demos), { status: 200 });
  })
);

// POST schedule a new demo session
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "operations-manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    const { courseId, scheduledStart, duration, email, fullName, phone, meetingPlatform, teacherId } = body;

    if (!courseId || !scheduledStart || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const parent = await Parent.findOne({ email });
    const studentId = body.studentId && mongoose.isValidObjectId(body.studentId)
      ? new (mongoose.Types.ObjectId as any)(body.studentId)
      : undefined;

    // Upsert Lead
    let lead = await Lead.findOne({ email });
    if (!lead) {
      const count = await Lead.countDocuments();
      lead = await Lead.create({
        leadId: `LED-${Date.now().toString().slice(-4)}${String(count + 1).padStart(4, "0")}`,
        email,
        fullName,
        phone: phone || "0000000000",
        interestedCourse: course.courseName,
        course: course._id,
        parent: parent ? parent._id : undefined,
        student: studentId,
        status: "demo_scheduled",
        leadSource: "admin",
      });
    } else {
      await Lead.findByIdAndUpdate(lead._id, {
        status: "demo_scheduled",
        interestedCourse: course.courseName,
        course: course._id,
        ...(parent ? { parent: parent._id, fullName: `${parent.firstName} ${parent.lastName}`.trim() } : (fullName ? { fullName } : {})),
        ...(studentId ? { student: studentId } : {}),
      });
    }

    const demoCode = `DEMO-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
    const start = new Date(scheduledStart);
    const end = new Date(start.getTime() + (duration || 45) * 60000);

    // Derive eligible teacher from explicit teacherId or deterministic course demo faculty selection
    const { DemoTeacherService } = await import("../../../../services/demo/demo-teacher.service");
    const { Teacher } = await import("../../../../models/teacher.model");
    const { JobEngineService } = await import("../../../../services/jobs/job-engine.service");

    let assignedTeacher: any = null;
    if (teacherId && mongoose.isValidObjectId(teacherId)) {
      const { allEligibleTeachers } = await DemoTeacherService.resolveEligibleTeachersForCourse(course._id);
      const isEligible = allEligibleTeachers.some((t: any) => t._id.toString() === teacherId.toString());
      if (isEligible) {
        const check = await DemoTeacherService.checkTeacherConflict(teacherId, start, end);
        if (check.available) {
          assignedTeacher = await Teacher.findById(teacherId);
        }
      }
    }
    if (!assignedTeacher) {
      const selection = await DemoTeacherService.selectDemoTeacher(course._id, start, end);
      assignedTeacher = selection.teacher;
    }

    const demo = await DemoSession.create({
      demoCode,
      lead: lead._id,
      parent: parent ? parent._id : undefined,
      student: studentId,
      teacher: assignedTeacher ? assignedTeacher._id : undefined,
      interestedCourse: course.courseName,
      course: course._id,
      scheduledStart: start,
      scheduledEnd: end,
      duration: duration || 45,
      meetingPlatform: meetingPlatform || "jitsi",
      meetingLink: "/admin/crm/demos/join", // or whatever the admin demo join link is
      status: "scheduled",
    });

    if (assignedTeacher) {
      const teacherDoc = await Teacher.findById(assignedTeacher._id).populate("user", "email");
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
            childName: fullName || "Student",
            programName: course.courseName,
            scheduledStart: start,
            scheduledEnd: end,
            duration: duration || 45,
            demoCode,
          },
          priority: "high",
        });
      }
    }

    const populatedDemo = await DemoSession.findById(demo._id)
      .populate("course", "courseName courseCode slug")
      .populate("parent", "firstName lastName email phone")
      .populate("student", "firstName lastName studentCode")
      .populate("lead", "fullName email phone status")
      .populate("teacher", "firstName lastName email teacherCode");

    return NextResponse.json(ResponseHelper.success("Demo scheduled successfully", populatedDemo), { status: 201 });
  })
);
