
/**
 * @swagger
 * /api/analytics/widgets:
 *   post:
 *     summary: Auto-generated summary for POST /api/analytics/widgets
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
 * /api/analytics/widgets:
 *   get:
 *     summary: Auto-generated summary for GET /api/analytics/widgets
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
    const result = await DashboardService.listWidgets(params);
    return NextResponse.json(ResponseHelper.success("Widgets fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin"],
  async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    const widget = await DashboardService.createWidget(body);
    return NextResponse.json(ResponseHelper.success("Widget created", widget), { status: 201 });
  }
);
