
/**
 * @swagger
 * /api/notifications/timeline:
 *   get:
 *     summary: Auto-generated summary for GET /api/notifications/timeline
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
import { TimelineService } from "../../../../services/notification/timeline.service";

export const GET = withRoles(
  ["super-admin", "admin", "marketing", "support"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await TimelineService.listTimeline(params);
    return NextResponse.json(ResponseHelper.success("Notification timeline logs fetched", result));
  }
);
