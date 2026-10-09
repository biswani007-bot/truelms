
/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Auto-generated summary for POST /api/courses
 *     tags: [courses]
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
 * /api/courses:
 *   get:
 *     summary: Auto-generated summary for GET /api/courses
 *     tags: [courses]
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
import { withRoles } from "../../../middleware/auth.middleware";
import { courseRepository } from "../../../repositories/course.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";

// GET Paginated Courses
export const dynamic = 'force-dynamic';
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const limit = url.searchParams.get("limit");
    const search = url.searchParams.get("search") || undefined;
    const sort = url.searchParams.get("sort") || undefined;
    const order = url.searchParams.get("order") || undefined;

    const paginationInput = PaginationSchema.parse({
      page,
      limit,
      search,
      sort,
      order,
    });

    // Custom Filters
    const level = url.searchParams.get("level");
    const deliveryMode = url.searchParams.get("deliveryMode");
    const status = url.searchParams.get("status");

    if (level) paginationInput.filters.level = level;
    if (deliveryMode) paginationInput.filters.deliveryMode = deliveryMode;
    if (status) paginationInput.filters.status = status;

    const searchableFields = ["courseName", "courseCode", "slug"];
    const result = await courseRepository.paginate(paginationInput, searchableFields, {
      populate: [
        { path: "category" },
        { path: "instructors" },
        { path: "demoFaculty.primaryTeacher", select: "firstName lastName employeeId teacherCode status" },
        { path: "demoFaculty.eligibleTeachers", select: "firstName lastName employeeId teacherCode status" },
        { path: "demoFaculty.backupTeacher", select: "firstName lastName employeeId teacherCode status" },
      ] as any,
    });

    return NextResponse.json(
      ResponseHelper.success("Fetched courses successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Course
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    const course = await courseRepository.create(body);

    return NextResponse.json(
      ResponseHelper.success("Course created successfully", course),
      { status: 201 }
    );
  })
);
