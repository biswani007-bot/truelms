
/**
 * @swagger
 * /api/notifications/history:
 *   get:
 *     summary: Auto-generated summary for GET /api/notifications/history
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
import { DeliveryService } from "../../../../services/notification/delivery.service";

export const GET = withRoles(
  ["super-admin", "admin", "marketing", "support"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await DeliveryService.listDeliveryHistory(params);
    return NextResponse.json(ResponseHelper.success("Notification delivery history fetched", result));
  }
);
