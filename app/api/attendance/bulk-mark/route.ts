
/**
 * @swagger
 * /api/attendance/bulk-mark:
 *   post:
 *     summary: Auto-generated summary for POST /api/attendance/bulk-mark
 *     tags: [attendance]
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
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { AttendanceService } from "../../../../services/attendance/attendance.service";

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const { batch, records, attendanceDate } = body;
    let { liveClass, teacher } = body;

    if (!batch || !records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        ResponseHelper.error("batch and non-empty records array are required"),
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(batch)) {
      return NextResponse.json(ResponseHelper.error("Invalid batch ID"), { status: 400 });
    }

    const { Batch } = await import("../../../../models/batch.model");
    const { Teacher } = await import("../../../../models/teacher.model");
    const { BatchTeacher } = await import("../../../../models/batch-teacher.model");
    const { BatchStudent } = await import("../../../../models/batch-student.model");
    const { LiveClass } = await import("../../../../models/live-class.model");

    const batchDoc = await Batch.findById(batch);
    if (!batchDoc || (batchDoc as any).isDeleted) {
      return NextResponse.json(ResponseHelper.error("Batch not found", "NOT_FOUND"), { status: 404 });
    }

    // Role-based authorization for Teacher
    let effectiveTeacherId = teacher;
    if (userContext?.role === "Teacher") {
      const teacherDoc: any = await Teacher.findOne({
        user: userContext.userId || userContext.id || userContext._id,
      }).lean();

      if (!teacherDoc) {
        return NextResponse.json(
          ResponseHelper.error("Teacher profile not found", "NOT_FOUND"),
          { status: 404 }
        );
      }

      const isDirect =
        batchDoc.primaryTeacher?.toString() === teacherDoc._id.toString() ||
        batchDoc.assistantTeacher?.toString() === teacherDoc._id.toString() ||
        batchDoc.mentor?.toString() === teacherDoc._id.toString();

      const isAssigned = isDirect || await BatchTeacher.findOne({
        batch,
        teacher: teacherDoc._id,
        status: "active",
      });

      if (!isAssigned) {
        return NextResponse.json(
          ResponseHelper.error("Access Denied: You are not authorized to mark attendance for this batch.", "FORBIDDEN"),
          { status: 403 }
        );
      }

      effectiveTeacherId = teacherDoc._id.toString();
    } else {
      if (!effectiveTeacherId) {
        effectiveTeacherId = batchDoc.primaryTeacher?.toString() || userContext.userId;
      }
    }

    // Server-side validation of student roster membership
    const enrolledBatchStudents = await BatchStudent.find({
      batch,
      status: "active",
      isDeleted: { $ne: true },
    }).select("student").lean();

    const enrolledStudentIds = new Set(
      enrolledBatchStudents.map((bs) => bs.student.toString())
    );

    for (const r of records) {
      const stId = (r.student || "").toString();
      if (!enrolledStudentIds.has(stId)) {
        return NextResponse.json(
          ResponseHelper.error(
            `Access Denied: Student ${stId} is not enrolled in batch ${batchDoc.batchCode || batch}.`,
            "FORBIDDEN"
          ),
          { status: 403 }
        );
      }
    }

    let sessionDate: Date;
    if (attendanceDate) {
      const parts = String(attendanceDate).split("T")[0].split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        sessionDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
      } else {
        sessionDate = new Date(attendanceDate);
      }
    } else {
      sessionDate = new Date();
    }

    const startOfDay = new Date(sessionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Resolve or establish class session
    let targetLiveClass = null;
    if (liveClass && mongoose.isValidObjectId(liveClass)) {
      targetLiveClass = await LiveClass.findById(liveClass);
    }
    if (!targetLiveClass) {
      targetLiveClass = await LiveClass.findOne({
        batch,
        startDate: { $gte: startOfDay, $lte: endOfDay },
        isDeleted: { $ne: true },
      }).sort({ startDate: -1 });
    }
    if (!targetLiveClass) {
      targetLiveClass = await LiveClass.findOne({
        batch,
        isDeleted: { $ne: true },
      }).sort({ startDate: -1 });
    }

    if (!targetLiveClass) {
      const count = await LiveClass.countDocuments({});
      targetLiveClass = await LiveClass.create({
        classCode: `LVC-${String(count + 1).padStart(4, "0")}`,
        classTitle: `${batchDoc.batchName} Lecture Session`,
        batch,
        course: batchDoc.course,
        cohort: batchDoc.cohort,
        teacher: effectiveTeacherId,
        startDate: sessionDate,
        endDate: new Date(sessionDate.getTime() + 60 * 60000),
        duration: 60,
        timezone: "UTC",
        meetingPlatform: "truelern",
        meetingLink: "/teacher/attendance",
        status: "completed",
      });
    }

    const results = await AttendanceService.bulkMark(
      targetLiveClass._id.toString(),
      batch,
      effectiveTeacherId,
      records,
      userContext.userId,
      sessionDate
    );

    return NextResponse.json(
      ResponseHelper.success("Bulk attendance marked successfully", results),
      { status: 201 }
    );
  })
);
