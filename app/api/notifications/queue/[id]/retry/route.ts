
/**
 * @swagger
 * /api/notifications/queue/{id}/retry:
 *   post:
 *     summary: Auto-generated summary for POST /api/notifications/queue/{id}/retry
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
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";
import { DeliveryService } from "../../../../../../services/notification/delivery.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["super-admin", "admin", "support"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const success = await DeliveryService.processQueueItem(id);
    if (!success) {
      return NextResponse.json(ResponseHelper.error("Retry attempt failed"), { status: 400 });
    }
    return NextResponse.json(ResponseHelper.success("Notification queue item retried"));
  })
);
