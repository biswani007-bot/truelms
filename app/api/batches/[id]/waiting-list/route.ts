
/**
 * @swagger
 * /api/batches/{id}/waiting-list:
 *   post:
 *     summary: Auto-generated summary for POST /api/batches/{id}/waiting-list
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
 * /api/batches/{id}/waiting-list:
 *   get:
 *     summary: Auto-generated summary for GET /api/batches/{id}/waiting-list
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
import { batchWaitingListRepository } from "../../../../../repositories/batch-waiting-list.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { WaitingListService } from "../../../../../services/batch/waiting-list.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Waiting list for batch (sorted by position)
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const entries = await batchWaitingListRepository.findMany(
      { batch: id, status: "waiting" },
      { populate: ["student", "enrollment"] }
    );

    // Sort by priority then position
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
    const sorted = (entries as any[]).sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return a.position - b.position;
    });

    return NextResponse.json(
      ResponseHelper.success("Waiting list fetched", sorted),
      { status: 200 }
    );
  })
);

// POST Add student to waiting list manually
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const { studentId, enrollmentId, priority = "normal" } = body;
    if (!studentId || !enrollmentId) {
      return NextResponse.json(
        ResponseHelper.error("studentId and enrollmentId are required"),
        { status: 400 }
      );
    }

    const entry = await WaitingListService.addToWaitingList(id, studentId, enrollmentId, {
      priority,
      userId: userContext.userId,
    });

    return NextResponse.json(
      ResponseHelper.success("Student added to waiting list", entry),
      { status: 201 }
    );
  })
);
