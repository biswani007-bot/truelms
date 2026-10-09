
/**
 * @swagger
 * /api/notifications/inbox:
 *   post:
 *     summary: Auto-generated summary for POST /api/notifications/inbox
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

/**
 * @swagger
 * /api/notifications/inbox:
 *   get:
 *     summary: Auto-generated summary for GET /api/notifications/inbox
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
import { withAuth } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { connectDB } from "../../../../config/db";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { NotificationService } from "../../../../services/notification/notification.service";

export const GET = withAuth(
  async (req: NextRequest, user) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await NotificationService.listInbox(user.userId, params);
    return NextResponse.json(ResponseHelper.success("User notifications inbox fetched", result));
  }
);

export const POST = withAuth(
  async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    const { notificationId, action } = body;

    if (!notificationId) {
      return NextResponse.json(ResponseHelper.error("notificationId is required"), { status: 400 });
    }

    if (action === "read") {
      const updated = await NotificationService.markAsRead(notificationId);
      return NextResponse.json(ResponseHelper.success("Notification marked as read", updated));
    } else if (action === "archive") {
      const updated = await NotificationService.archive(notificationId);
      return NextResponse.json(ResponseHelper.success("Notification archived", updated));
    } else {
      return NextResponse.json(ResponseHelper.error("Invalid action. Must be 'read' or 'archive'"), { status: 400 });
    }
  }
);
