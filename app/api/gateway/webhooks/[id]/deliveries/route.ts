
/**
 * @swagger
 * /api/gateway/webhooks/{id}/deliveries:
 *   get:
 *     summary: Auto-generated summary for GET /api/gateway/webhooks/{id}/deliveries
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
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";
import { PaginationSchema } from "../../../../../../dtos/pagination.dto";
import { webhookDeliveryRepository } from "../../../../../../repositories/webhook-delivery.repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withRoles(
  ["super-admin", "admin", "api-manager"],
  apiHandler(async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));

    const result = await webhookDeliveryRepository.paginate(
      {
        ...params,
        filters: { ...params.filters, webhook: id },
      },
      ["status"],
      {
        populate: ["webhookEvent"],
      }
    );

    return NextResponse.json(ResponseHelper.success("Webhook deliveries fetched", result));
  })
);
