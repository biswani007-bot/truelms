
/**
 * @swagger
 * /api/reports/snapshot:
 *   post:
 *     summary: Auto-generated summary for POST /api/reports/snapshot
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
 * /api/reports/snapshot:
 *   get:
 *     summary: Auto-generated summary for GET /api/reports/snapshot
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
import { SnapshotService } from "../../../../services/reports/snapshot.service";

export const GET = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await SnapshotService.listSnapshots(params);
    return NextResponse.json(ResponseHelper.success("Snapshots fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin"],
  async (req: NextRequest, user) => {
    await connectDB();
    const body = await req.json();
    const { type, name, sessionName, period } = body;

    let snapshot;
    if (type === "daily") {
      snapshot = await SnapshotService.generateDailySnapshot(new Date(), user.userId);
    } else if (type === "monthly") {
      const now = new Date();
      snapshot = await SnapshotService.generateMonthlySnapshot(now.getFullYear(), now.getMonth() + 1, user.userId);
    } else if (type === "session") {
      if (!sessionName) throw new Error("sessionName is required for session snapshot");
      snapshot = await SnapshotService.generateSessionSnapshot(sessionName, user.userId);
    } else if (type === "financial") {
      if (!period) throw new Error("period is required for financial snapshot");
      snapshot = await SnapshotService.generateFinancialSnapshot(period, user.userId);
    } else {
      throw new Error(`Unsupported snapshot type: ${type}`);
    }

    return NextResponse.json(ResponseHelper.success("Snapshot generated", snapshot), { status: 201 });
  }
);
