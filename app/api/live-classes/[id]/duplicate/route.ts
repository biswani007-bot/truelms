
/**
 * @swagger
 * /api/live-classes/{id}/duplicate:
 *   post:
 *     summary: Auto-generated summary for POST /api/live-classes/{id}/duplicate
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
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const { startDate } = body;
    if (!startDate) {
      return NextResponse.json(ResponseHelper.error("startDate is required for cloning"), { status: 400 });
    }

    const cloned = await LiveClassService.duplicateClass(id, new Date(startDate), userContext.userId);

    return NextResponse.json(ResponseHelper.success("Live class duplicated successfully", cloned), { status: 201 });
  })
);
