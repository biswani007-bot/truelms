
/**
 * @swagger
 * /api/teachers:
 *   post:
 *     summary: Auto-generated summary for POST /api/teachers
 *     tags: [teachers]
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
 * /api/teachers:
 *   get:
 *     summary: Auto-generated summary for GET /api/teachers
 *     tags: [teachers]
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
import { teacherRepository } from "../../../repositories/teacher.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";

// GET Paginated Teachers
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
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
    const status = url.searchParams.get("status");
    const department = url.searchParams.get("department");

    if (status) paginationInput.filters.status = status;
    if (department) paginationInput.filters.department = department;

    const searchableFields = ["firstName", "lastName", "employeeId", "teacherCode", "phone", "skills"];
    const result = await teacherRepository.paginate(paginationInput, searchableFields, { populate: "user" });

    return NextResponse.json(
      ResponseHelper.success("Fetched teachers successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Teacher Profile
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    const count = await teacherRepository.findMany().then((res) => res.length);
    const employeeId = `EMP-${1000 + count + 1}`;
    const teacherCode = `TCH-${1000 + count + 1}`;

    const teacher = await teacherRepository.create({
      ...body,
      employeeId,
      teacherCode,
      status: body.status || "active",
    });

    return NextResponse.json(
      ResponseHelper.success("Teacher profile created successfully", teacher),
      { status: 201 }
    );
  })
);
