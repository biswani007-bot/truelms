
/**
 * @swagger
 * /api/analytics/admissions:
 *   get:
 *     summary: Auto-generated summary for GET /api/analytics/admissions
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
import { AnalyticsService } from "../../../../services/reports/analytics.service";

export const GET = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;

    const result = await AnalyticsService.getAdmissionsKPIs(dateFrom, dateTo);
    return NextResponse.json(ResponseHelper.success("Admissions KPIs aggregated", result));
  }
);
