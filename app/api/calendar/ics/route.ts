
/**
 * @swagger
 * /api/calendar/ics:
 *   get:
 *     summary: Auto-generated summary for GET /api/calendar/ics
 *     tags: [calendar]
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
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../../../middleware/auth.middleware";
import { LiveClass } from "../../../../models/live-class.model";
import { BatchStudent } from "../../../../models/batch-student.model";
import { ParentStudentLink } from "../../../../models/parent-student-link.model";
import { Parent } from "../../../../models/parent.model";
import { Student } from "../../../../models/student.model";
import { CalendarService, ICalendarEvent } from "../../../../services/calendar/calendar.service";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = (user.role || "").toLowerCase();
  let batchIds: mongoose.Types.ObjectId[] = [];

  if (role === "student") {
    const student = await Student.findOne({ user: user.userId });
    if (student) {
      const enrollments = await BatchStudent.find({ student: student._id, status: "active" });
      batchIds = enrollments.map((e) => e.batch as any);
    }
  } else if (role === "parent") {
    const parent = await Parent.findOne({ user: user.userId, status: "active" });
    if (parent) {
      const links = await ParentStudentLink.find({ parent: parent._id, canAccessPortal: true });
      const studentIds = links.map((l) => l.student);
      const enrollments = await BatchStudent.find({ student: { $in: studentIds }, status: "active" });
      batchIds = enrollments.map((e) => e.batch as any);
    }
  } else if (role === "teacher") {
    const { Teacher } = await import("../../../../models/teacher.model");
    const teacher = await Teacher.findOne({ user: user.userId });
    const { BatchTeacher } = await import("../../../../models/batch-teacher.model");
    if (teacher) {
      const assignments = await BatchTeacher.find({ teacher: teacher._id, status: "active" });
      batchIds = assignments.map((a) => a.batch as any);
    }
  } else if (/admin/i.test(role)) {
    // Admin can view all
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const classes = await LiveClass.find({ isDeleted: { $ne: true } }).limit(100);
    const events: ICalendarEvent[] = classes.map((lc) => ({
      uid: lc._id.toString(),
      title: lc.classTitle,
      startDate: lc.startDate,
      endDate: lc.endDate || new Date(lc.startDate.getTime() + (lc.duration || 60) * 60000),
      location: "TrueLern Live Classroom",
      url: `${appUrl}/live-classes/${lc._id}`,
    }));
    return new NextResponse(CalendarService.generateICS(events), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="truelern-schedule.ics"',
      },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const liveClasses = await LiveClass.find({
    batch: { $in: batchIds },
    isDeleted: { $ne: true },
  }).limit(50);

  const events: ICalendarEvent[] = liveClasses.map((lc) => ({
    uid: lc._id.toString(),
    title: lc.classTitle,
    description: `Session for batch: ${lc.batch}`,
    startDate: lc.startDate,
    endDate: lc.endDate || new Date(lc.startDate.getTime() + (lc.duration || 60) * 60000),
    location: "TrueLern Live Classroom",
    url: `${appUrl}/live-classes/${lc._id}`,
  }));

  const icsData = CalendarService.generateICS(events);

  return new NextResponse(icsData, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="truelern-schedule.ics"',
    },
  });
}
