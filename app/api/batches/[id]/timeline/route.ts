
/**
 * @swagger
 * /api/batches/{id}/timeline:
 *   get:
 *     summary: Auto-generated summary for GET /api/batches/{id}/timeline
 *     tags: [batches]
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { batchTimelineRepository } from "../../../../../repositories/batch-timeline.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { PaginationSchema } from "../../../../../dtos/pagination.dto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Timeline audit log for batch
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const url = new URL(req.url);

    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      sort: "timestamp",
      order: "desc",
    });

    const result = await batchTimelineRepository.paginate(
      paginationInput,
      ["event", "description"],
      { populate: ["performedBy"] }
    );

    // Filter to current batch – add filter after parse
    result.data = result.data.filter((t: any) => t.batch?.toString() === id);

    return NextResponse.json(
      ResponseHelper.success("Batch timeline fetched", result.data, result.meta),
      { status: 200 }
    );
  })
);
