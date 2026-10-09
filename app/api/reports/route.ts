
/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Auto-generated summary for POST /api/reports
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
 * /api/reports:
 *   get:
 *     summary: Auto-generated summary for GET /api/reports
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
import { withRoles } from "../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../helpers/response";
import { connectDB } from "../../../config/db";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { ReportService } from "../../../services/reports/report.service";

export const GET = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  async (req: NextRequest, user) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await ReportService.listDefinitions(params);
    return NextResponse.json(ResponseHelper.success("Report definitions fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin"],
  async (req: NextRequest, user) => {
    await connectDB();
    const body = await req.json();
    const definition = await ReportService.createDefinition(body, user.userId);
    return NextResponse.json(
      ResponseHelper.success("Report definition created", definition),
      { status: 201 }
    );
  }
);
