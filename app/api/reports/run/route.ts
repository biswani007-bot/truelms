
/**
 * @swagger
 * /api/reports/run:
 *   post:
 *     summary: Auto-generated summary for POST /api/reports/run
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
import { connectDB } from "../../../../config/db";
import { ReportService } from "../../../../services/reports/report.service";

export const POST = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  async (req: NextRequest, user) => {
    await connectDB();
    const body = await req.json();
    const { reportDefinitionId, filters = {} } = body;
    if (!reportDefinitionId) {
      return NextResponse.json(
        ResponseHelper.error("reportDefinitionId is required"),
        { status: 400 }
      );
    }
    const execution = await ReportService.runReport(reportDefinitionId, filters, user.userId);
    return NextResponse.json(
      ResponseHelper.success("Report executed", execution),
      { status: 201 }
    );
  }
);
