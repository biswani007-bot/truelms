
/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Auto-generated summary for POST /api/students
 *     tags: [students]
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
 * /api/students:
 *   get:
 *     summary: Auto-generated summary for GET /api/students
 *     tags: [students]
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
import { studentRepository } from "../../../repositories/student.repository";
import { studentTimelineRepository } from "../../../repositories/student-timeline.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";

// GET Paginated Students
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Counsellor"],
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
    const country = url.searchParams.get("country");

    if (status) paginationInput.filters.status = status;
    if (country) paginationInput.filters.country = country;

    const searchableFields = ["firstName", "lastName", "studentId", "admissionNumber", "registrationNumber", "phone"];
    const result = await studentRepository.paginate(paginationInput, searchableFields, { populate: "user" });

    return NextResponse.json(
      ResponseHelper.success("Fetched students successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Student Profile
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Counsellor"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const count = await studentRepository.findMany().then((res) => res.length);
    const studentId = `STD-${1000 + count + 1}`;
    const admissionNumber = `ADM-${1000 + count + 1}`;
    const registrationNumber = `REG-${1000 + count + 1}`;

    const student = await studentRepository.create({
      ...body,
      studentId,
      admissionNumber,
      registrationNumber,
      status: body.status || "active",
    });

    // Log Timeline Event
    await studentTimelineRepository.create({
      student: student._id,
      event: "registered",
      description: "Student file registered inside SIS",
      performedBy: userContext.userId,
    });

    return NextResponse.json(
      ResponseHelper.success("Student profile created successfully", student),
      { status: 201 }
    );
  })
);
