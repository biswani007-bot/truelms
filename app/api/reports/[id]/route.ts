
/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/reports/{id}
 *     tags: [reports]
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
 * /api/reports/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/reports/{id}
 *     tags: [reports]
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
 * /api/reports/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/reports/{id}
 *     tags: [reports]
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
import { connectDB } from "../../../../config/db";
import { ReportService } from "../../../../services/reports/report.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const definition = await ReportService.findDefinition(id);
    if (!definition) {
      return NextResponse.json(ResponseHelper.error("Report definition not found"), { status: 404 });
    }
    return NextResponse.json(ResponseHelper.success("Report definition fetched", definition));
  })
);

export const PUT = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();
    const updated = await ReportService.updateDefinition(id, body);
    return NextResponse.json(ResponseHelper.success("Report definition updated", updated));
  })
);

export const DELETE = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    await ReportService.deleteDefinition(id);
    return NextResponse.json(ResponseHelper.success("Report definition deleted"));
  })
);
