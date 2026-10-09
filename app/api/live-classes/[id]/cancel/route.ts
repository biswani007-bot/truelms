
/**
 * @swagger
 * /api/live-classes/{id}/cancel:
 *   post:
 *     summary: Auto-generated summary for POST /api/live-classes/{id}/cancel
 *     tags: [live-classes]
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { LiveClassService } from "../../../../../services/live-class/live-class.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const cancelled = await LiveClassService.cancelClass(id, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Live class cancelled successfully", cancelled), { status: 200 });
  })
);
