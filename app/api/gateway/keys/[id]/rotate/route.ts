
/**
 * @swagger
 * /api/gateway/keys/{id}/rotate:
 *   post:
 *     summary: Auto-generated summary for POST /api/gateway/keys/{id}/rotate
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
import { ApiKeyService } from "../../../../../../services/gateway/api-key.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["super-admin", "admin", "api-manager"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const newSecret = await ApiKeyService.rotateSecret(id);
    return NextResponse.json(ResponseHelper.success("API Key secret rotated", { secret: newSecret }));
  })
);
