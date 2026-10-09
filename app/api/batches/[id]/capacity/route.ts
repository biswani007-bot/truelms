
/**
 * @swagger
 * /api/batches/{id}/capacity:
 *   get:
 *     summary: Auto-generated summary for GET /api/batches/{id}/capacity
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { CapacityService } from "../../../../../services/batch/capacity.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Real-time capacity snapshot for batch
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const snapshot = await CapacityService.getSnapshot(id);

    return NextResponse.json(
      ResponseHelper.success("Capacity snapshot fetched (from Platform Settings)", snapshot),
      { status: 200 }
    );
  })
);
