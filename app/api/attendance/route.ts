
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
  apiHandler(async (req: NextRequest) => {
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

    if (status) paginationInput.filters.status = status;
    if (teacher) paginationInput.filters.teacher = teacher;
    if (batch) paginationInput.filters.batch = batch;
    if (student) paginationInput.filters.student = student;
    if (liveClass) paginationInput.filters.liveClass = liveClass;

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

    const record = await AttendanceService.markAttendance(body, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Attendance marked successfully", record),
      { status: 201 }
    );
  })
);
