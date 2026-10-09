
/**
 * @swagger
 * /api/analytics/dashboards:
 *   post:
 *     summary: Auto-generated summary for POST /api/analytics/dashboards
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
 * /api/analytics/dashboards:
 *   get:
 *     summary: Auto-generated summary for GET /api/analytics/dashboards
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { connectDB } from "../../../../config/db";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { DashboardService } from "../../../../services/reports/dashboard.service";

export const GET = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await DashboardService.listDashboards(params);
    return NextResponse.json(ResponseHelper.success("Dashboards fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin"],
  async (req: NextRequest, user) => {
    await connectDB();
    const body = await req.json();
    const dashboard = await DashboardService.createDashboard(body, user.userId);
    return NextResponse.json(ResponseHelper.success("Dashboard created", dashboard), { status: 201 });
  }
);
