
/**
 * @swagger
 * /api/gateway/webhooks/deliveries/{id}/retry:
 *   post:
 *     summary: Auto-generated summary for POST /api/gateway/webhooks/deliveries/{id}/retry
 *     tags: [gateway]
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
import { withRoles } from "../../../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../../../helpers/response";
import { apiHandler } from "../../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../../config/db";
import { WebhookDeliveryService } from "../../../../../../../services/gateway/webhook-delivery.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["super-admin", "admin", "api-manager"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const retried = await WebhookDeliveryService.retryDelivery(id);
    return NextResponse.json(ResponseHelper.success("Webhook delivery manual retry initiated", { retried }));
  })
);
