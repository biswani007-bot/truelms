
/**
 * @swagger
 * /api/finance/fee-plans:
 *   post:
 *     summary: Auto-generated summary for POST /api/finance/fee-plans
 *     tags: [finance]
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
 * /api/finance/fee-plans:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/fee-plans
 *     tags: [finance]
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { connectDB } from "../../../../config/db";
import { feePlanRepository } from "../../../../repositories/fee-plan.repository";
import { FeePlanService } from "../../../../services/finance/fee-plan.service";

// GET – paginated fee plans
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant"],
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

    const course = url.searchParams.get("course");
    if (course) paginationInput.filters.course = course;

    const searchableFields = ["code", "academicSession"];
    const result = await feePlanRepository.paginate(paginationInput, searchableFields, {
      populate: ["course"],
    });

    return NextResponse.json(
      ResponseHelper.success("Fee plans fetched successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST – create a new fee plan
export const POST = withRoles(
  ["Admin", "Super Admin", "Finance Manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.code || !body.course || !body.academicSession || !body.baseFee) {
      return NextResponse.json(
        ResponseHelper.error("code, course, academicSession, and baseFee are required"),
        { status: 400 }
      );
    }

    const feePlan = await FeePlanService.create(body);
    return NextResponse.json(
      ResponseHelper.success("Fee plan created successfully", feePlan),
      { status: 201 }
    );
  })
);
