
/**
 * @swagger
 * /api/analytics/widgets/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/analytics/widgets/{id}
 *     tags: [analytics]
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
 * /api/analytics/widgets/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/analytics/widgets/{id}
 *     tags: [analytics]
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
 * /api/analytics/widgets/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/analytics/widgets/{id}
 *     tags: [analytics]
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { DashboardService } from "../../../../../services/reports/dashboard.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const widget = await DashboardService.findWidget(id);
    if (!widget) {
      return NextResponse.json(ResponseHelper.error("Widget not found"), { status: 404 });
    }
    return NextResponse.json(ResponseHelper.success("Widget fetched", widget));
  })
);

export const PUT = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();
    const updated = await DashboardService.updateWidget(id, body);
    return NextResponse.json(ResponseHelper.success("Widget updated", updated));
  })
);

export const DELETE = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    await DashboardService.deleteWidget(id);
    return NextResponse.json(ResponseHelper.success("Widget deleted"));
  })
);
