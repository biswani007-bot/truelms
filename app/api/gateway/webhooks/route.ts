
/**
 * @swagger
 * /api/gateway/webhooks:
 *   post:
 *     summary: Auto-generated summary for POST /api/gateway/webhooks
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

/**
 * @swagger
 * /api/gateway/webhooks:
 *   get:
 *     summary: Auto-generated summary for GET /api/gateway/webhooks
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { connectDB } from "../../../../config/db";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { WebhookService } from "../../../../services/gateway/webhook.service";

export const GET = withRoles(
  ["super-admin", "admin", "api-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await WebhookService.listWebhooks(params);
    return NextResponse.json(ResponseHelper.success("Webhooks fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin", "api-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    const result = await WebhookService.registerWebhook(body);
    return NextResponse.json(ResponseHelper.success("Webhook registered", result), { status: 201 });
  }
);
