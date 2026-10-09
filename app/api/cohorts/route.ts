
/**
 * @swagger
 * /api/cohorts:
 *   post:
 *     summary: Auto-generated summary for POST /api/cohorts
 *     tags: [cohorts]
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
 * /api/cohorts:
 *   get:
 *     summary: Auto-generated summary for GET /api/cohorts
 *     tags: [cohorts]
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
import { cohortRepository } from "../../../repositories/cohort.repository";
import { cohortTimelineRepository } from "../../../repositories/cohort-timeline.repository";
import { cohortCalendarRepository } from "../../../repositories/cohort-calendar.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";

// GET Paginated Cohorts
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
    const status = url.searchParams.get("status");
    const course = url.searchParams.get("course");

    if (status) paginationInput.filters.status = status;
    if (course) paginationInput.filters.course = course;

    const searchableFields = ["cohortCode", "cohortName", "language", "timezone"];
    const result = await cohortRepository.paginate(paginationInput, searchableFields, { populate: ["course", "academicSession", "primaryInstructor"] });

    return NextResponse.json(
      ResponseHelper.success("Fetched cohorts successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Cohort Profile
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const count = await cohortRepository.findMany().then((res) => res.length);
    const cohortCode = `CH-${2026 + count + 1}`;

    const cohort = await cohortRepository.create({
      ...body,
      cohortCode,
      status: body.status || "planning",
    });

    // Create Calendar Schedule
    await cohortCalendarRepository.create({
      cohort: cohort._id,
      events: [
        { title: "Cohort Orientation Class", eventDate: cohort.startDate, type: "orientation" },
      ],
    });

    // Log Timeline Event
    await cohortTimelineRepository.create({
      cohort: cohort._id,
      event: "created",
      description: "Live learning cohort registered inside scheduling engine",
      performedBy: userContext.userId,
    });

    return NextResponse.json(
      ResponseHelper.success("Cohort profile created successfully", cohort),
      { status: 201 }
    );
  })
);
