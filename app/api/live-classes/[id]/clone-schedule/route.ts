
/**
 * @swagger
 * /api/live-classes/{id}/clone-schedule:
 *   post:
 *     summary: Auto-generated summary for POST /api/live-classes/{id}/clone-schedule
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

// Clone schedule settings to another batch
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params; // schedule definition id
    const body = await req.json();

    const { targetBatchId } = body;
    if (!targetBatchId) {
      return NextResponse.json(ResponseHelper.error("targetBatchId is required"), { status: 400 });
    }

    const result = await LiveClassService.cloneSchedule(id, targetBatchId, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Schedule cloned and class events generated", result), { status: 201 });
  })
);
