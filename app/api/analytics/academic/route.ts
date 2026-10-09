
/**
 * @swagger
 * /api/analytics/academic:
 *   get:
 *     summary: Auto-generated summary for GET /api/analytics/academic
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
  async () => {
    await connectDB();
    const result = await AnalyticsService.getAcademicKPIs();
    return NextResponse.json(ResponseHelper.success("Academic KPIs aggregated", result));
  }
);
