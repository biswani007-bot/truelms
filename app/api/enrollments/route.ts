
/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Auto-generated summary for POST /api/enrollments
 *     tags: [enrollments]
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
 * /api/enrollments:
 *   get:
 *     summary: Auto-generated summary for GET /api/enrollments
 *     tags: [enrollments]
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
import { enrollmentRepository } from "../../../repositories/enrollment.repository";
import { enrollmentTimelineRepository } from "../../../repositories/enrollment-timeline.repository";
import { enrollmentChecklistRepository } from "../../../repositories/enrollment-checklist.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";

// GET Paginated Enrollments
export const GET = withRoles(
  ["Admin", "Super Admin", "Admissions Manager", "Counsellor"],
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
    const course = url.searchParams.get("course");

    if (status) paginationInput.filters.status = status;
    if (course) paginationInput.filters.course = course;

    const searchableFields = ["enrollmentNumber", "academicSession", "remarks"];
    const result = await enrollmentRepository.paginate(paginationInput, searchableFields, { populate: ["student", "course", "admissionCounselor"] });

    return NextResponse.json(
      ResponseHelper.success("Fetched enrollments successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Enrollment Profile
export const POST = withRoles(
  ["Admin", "Super Admin", "Admissions Manager", "Counsellor"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const count = await enrollmentRepository.findMany().then((res) => res.length);
    const enrollmentNumber = `ENR-${10000 + count + 1}`;

    const enrollment = await enrollmentRepository.create({
      ...body,
      enrollmentNumber,
      status: body.status || "pending",
    });

    // Create Verification Checklist folder
    await enrollmentChecklistRepository.create({
      enrollment: enrollment._id,
      items: [
        { name: "Application Form", status: "completed" },
        { name: "Photo", status: "pending" },
        { name: "Identity Proof", status: "pending" },
        { name: "Qualification", status: "pending" },
      ],
    });

    // Log Timeline Event
    await enrollmentTimelineRepository.create({
      enrollment: enrollment._id,
      event: "created",
      description: "Enrollment file generated inside LMS Admissions workflow Engine",
      performedBy: userContext.userId,
    });

    return NextResponse.json(
      ResponseHelper.success("Enrollment created successfully", enrollment),
      { status: 201 }
    );
  })
);
