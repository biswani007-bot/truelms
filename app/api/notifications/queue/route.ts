
/**
 * @swagger
 * /api/notifications/queue:
 *   get:
 *     summary: Auto-generated summary for GET /api/notifications/queue
 *     tags: [notifications]
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
import { QueueService } from "../../../../services/notification/queue.service";

export const GET = withRoles(
  ["super-admin", "admin", "marketing", "support"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await QueueService.listQueue(params);
    return NextResponse.json(ResponseHelper.success("Notification queue fetched", result));
  }
);
