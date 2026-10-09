
/**
 * @swagger
 * /api/batches/{id}/recommendations:
 *   post:
 *     summary: Auto-generated summary for POST /api/batches/{id}/recommendations
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

/**
 * @swagger
 * /api/batches/{id}/recommendations:
 *   get:
 *     summary: Auto-generated summary for GET /api/batches/{id}/recommendations
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
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { RecommendationService } from "../../../../../services/batch/recommendation.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Recommendations for batch
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const url = new URL(req.url);
    const includeResolved = url.searchParams.get("includeResolved") === "true";

    const recommendations = includeResolved
      ? await RecommendationService.getStudentCount(id).then(() =>
          // Fall through to full list if includeResolved
          import("../../../../../repositories/batch-recommendation.repository").then((m) =>
            m.batchRecommendationRepository.findMany({ batch: id })
          )
        )
      : await RecommendationService.getUnresolved(id);

    return NextResponse.json(
      ResponseHelper.success("Recommendations fetched (advisory only – no auto-execution)", recommendations),
      { status: 200 }
    );
  })
);

// POST Trigger scan and generate recommendations
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const recommendations = await RecommendationService.scanBatch(id);

    return NextResponse.json(
      ResponseHelper.success(`${recommendations.length} recommendation(s) generated`, recommendations),
      { status: 201 }
    );
  })
);
