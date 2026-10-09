
/**
 * @swagger
 * /api/batches/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/batches/{id}
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
 * /api/batches/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/batches/{id}
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
 * /api/batches/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/batches/{id}
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { batchRepository } from "../../../../repositories/batch.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { BatchService } from "../../../../services/batch/batch.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Batch Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const batch = await batchRepository.findById(id, {
      populate: ["cohort", "course", "primaryTeacher", "assistantTeacher", "mentor"],
    });

    if (!batch) {
      return NextResponse.json(ResponseHelper.error("Batch not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Batch fetched", batch), { status: 200 });
  })
);

// PUT Update Batch
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    // If status is changing, use service to log timeline
    if (body.status) {
      await BatchService.updateStatus(id, body.status, userContext.userId);
    }

    const updated = await batchRepository.update(id, body);
    if (!updated) {
      return NextResponse.json(ResponseHelper.error("Batch not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Batch updated", updated), { status: 200 });
  })
);

// DELETE Soft-delete Batch
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const deleted = await batchRepository.softDelete(id);
    if (!deleted) {
      return NextResponse.json(ResponseHelper.error("Batch not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Batch archived", deleted), { status: 200 });
  })
);
