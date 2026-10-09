
/**
 * @swagger
 * /api/reports/schedule:
 *   post:
 *     summary: Auto-generated summary for POST /api/reports/schedule
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
 * /api/reports/schedule:
 *   get:
 *     summary: Auto-generated summary for GET /api/reports/schedule
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
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { ReportSchedulerService } from "../../../../services/reports/scheduler.service";

export const GET = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await ReportSchedulerService.listSchedules(params);
    return NextResponse.json(ResponseHelper.success("Report schedules fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin"],
  async (req: NextRequest, user) => {
    await connectDB();
    const body = await req.json();
    const schedule = await ReportSchedulerService.createSchedule(body, user.userId);
    return NextResponse.json(ResponseHelper.success("Report schedule created", schedule), { status: 201 });
  }
);
