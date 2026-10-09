
/**
 * @swagger
 * /api/batches/{id}/waiting-list/{entryId}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/batches/{id}/waiting-list/{entryId}
 *     tags: [batches]
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
 * /api/batches/{id}/waiting-list/{entryId}:
 *   post:
 *     summary: Auto-generated summary for POST /api/batches/{id}/waiting-list/{entryId}
 *     tags: [batches]
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
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";
import { WaitingListService } from "../../../../../../services/batch/waiting-list.service";

interface RouteParams {
  params: Promise<{ id: string; entryId: string }>;
}

// POST Promote (manual) a waiting list entry
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { entryId } = await routeCtx.params;

    const result = await WaitingListService.promoteManual(entryId, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Student promoted from waiting list", result),
      { status: 200 }
    );
  })
);

// DELETE Cancel a waiting list entry
export const DELETE = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { entryId } = await routeCtx.params;

    const result = await WaitingListService.cancel(entryId, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Waiting list entry cancelled", result),
      { status: 200 }
    );
  })
);
