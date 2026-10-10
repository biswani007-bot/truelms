
/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Auto-generated summary for POST /api/attendance
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

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Auto-generated summary for GET /api/attendance
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../middleware/auth.middleware";
import { attendanceRepository } from "../../../repositories/attendance.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";
import { AttendanceService } from "../../../services/attendance/attendance.service";

// GET Paginated Attendance records
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();

    const url = new URL(req.url);
    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    });

    const status = url.searchParams.get("status");
    const teacher = url.searchParams.get("teacher");
    const batch = url.searchParams.get("batch");
    const student = url.searchParams.get("student");
    const liveClass = url.searchParams.get("liveClass");
    const dateParam = url.searchParams.get("date") || url.searchParams.get("attendanceDate");

    if (status) paginationInput.filters.status = status;
    if (student) paginationInput.filters.student = student;
    if (liveClass) paginationInput.filters.liveClass = liveClass;
    if (dateParam) {
      const parts = dateParam.split("T")[0].split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        const startOfDay = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999));
        paginationInput.filters.attendanceDate = { $gte: startOfDay, $lte: endOfDay };
      } else {
        const d = new Date(dateParam);
        if (!isNaN(d.getTime())) {
          const start = new Date(d);
          start.setUTCHours(0, 0, 0, 0);
          const end = new Date(d);
          end.setUTCHours(23, 59, 59, 999);
          paginationInput.filters.attendanceDate = { $gte: start, $lte: end };
        }
      }
    }

    // Role-based scoping for Teacher
    if (userContext?.role === "Teacher") {
      const { Teacher } = await import("../../../models/teacher.model");
      const { Batch } = await import("../../../models/batch.model");
      const { BatchTeacher } = await import("../../../models/batch-teacher.model");

      const teacherDoc: any = await Teacher.findOne({
        user: userContext.userId || userContext.id || userContext._id,
      }).lean();

      if (!teacherDoc) {
        return NextResponse.json(
          ResponseHelper.success("Attendance records fetched successfully", [], {
            total: 0,
            page: 1,
            limit: paginationInput.limit || 10,
            totalPages: 0,
          }),
          { status: 200 }
        );
      }

      const directBatches: any = await Batch.find({
        $or: [
          { primaryTeacher: teacherDoc._id },
          { assistantTeacher: teacherDoc._id },
          { mentor: teacherDoc._id },
        ],
      }).select("_id").lean();

      const assignedBatchTeachers: any = await BatchTeacher.find({
        teacher: teacherDoc._id,
        status: "active",
      }).select("batch").lean();

      const teacherBatchIds = Array.from(
        new Set([
          ...directBatches.map((b: any) => b._id.toString()),
          ...assignedBatchTeachers.filter((bt: any) => bt.batch).map((bt: any) => bt.batch.toString()),
        ])
      );

      if (batch) {
        if (!teacherBatchIds.includes(batch)) {
          return NextResponse.json(
            ResponseHelper.error("Access Denied: You are not authorized to view attendance for this batch.", "FORBIDDEN"),
            { status: 403 }
          );
        }
        paginationInput.filters.batch = batch;
      } else {
        paginationInput.filters.batch = { $in: teacherBatchIds };
      }
    } else {
      if (teacher) paginationInput.filters.teacher = teacher;
      if (batch) paginationInput.filters.batch = batch;
    }

    if (!paginationInput.sort) {
      paginationInput.sort = "attendanceDate";
      paginationInput.order = "desc";
    }

    const searchableFields = ["attendanceNumber", "remarks"];
    const result = await attendanceRepository.paginate(paginationInput, searchableFields, {
      populate: ["student", "teacher", "liveClass", "batch"],
    });

    return NextResponse.json(
      ResponseHelper.success("Attendance records fetched successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST Mark Individual Attendance
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    if (userContext?.role === "Teacher") {
      const { Teacher } = await import("../../../models/teacher.model");
      const { Batch } = await import("../../../models/batch.model");
      const { BatchTeacher } = await import("../../../models/batch-teacher.model");
      const { BatchStudent } = await import("../../../models/batch-student.model");

      const teacherDoc: any = await Teacher.findOne({
        user: userContext.userId || userContext.id || userContext._id,
      }).lean();

      if (!teacherDoc) {
        return NextResponse.json(
          ResponseHelper.error("Teacher profile not found.", "NOT_FOUND"),
          { status: 404 }
        );
      }

      const isDirect = await Batch.findOne({
        _id: body.batch,
        $or: [
          { primaryTeacher: teacherDoc._id },
          { assistantTeacher: teacherDoc._id },
          { mentor: teacherDoc._id },
        ],
      });
      const isAssigned = isDirect || await BatchTeacher.findOne({
        batch: body.batch,
        teacher: teacherDoc._id,
        status: "active",
      });

      if (!isAssigned) {
        return NextResponse.json(
          ResponseHelper.error("Access Denied: You are not authorized to mark attendance for this batch.", "FORBIDDEN"),
          { status: 403 }
        );
      }

      // Validate student membership in batch
      const isStudentEnrolled = await BatchStudent.findOne({
        batch: body.batch,
        student: body.student,
        status: "active",
        isDeleted: { $ne: true },
      });
      if (!isStudentEnrolled) {
        return NextResponse.json(
          ResponseHelper.error("Access Denied: Student is not enrolled in this batch.", "FORBIDDEN"),
          { status: 403 }
        );
      }

      body.teacher = teacherDoc._id.toString();
    }

    const record = await AttendanceService.markAttendance(body, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Attendance marked successfully", record),
      { status: 201 }
    );
  })
);
