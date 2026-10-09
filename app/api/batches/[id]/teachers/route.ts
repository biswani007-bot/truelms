
/**
 * @swagger
 * /api/batches/{id}/teachers:
 *   post:
 *     summary: Auto-generated summary for POST /api/batches/{id}/teachers
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
 * /api/batches/{id}/teachers:
 *   get:
 *     summary: Auto-generated summary for GET /api/batches/{id}/teachers
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
import { batchTeacherRepository } from "../../../../../repositories/batch-teacher.repository";
import { batchTimelineRepository } from "../../../../../repositories/batch-timeline.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Teacher assignments for batch
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const teachers = await batchTeacherRepository.findMany(
      { batch: id, status: "active" },
      { populate: ["teacher"] }
    );

    return NextResponse.json(
      ResponseHelper.success("Batch teachers fetched", teachers),
      { status: 200 }
    );
  })
);

// POST Assign teacher to batch
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const { teacherId, role = "primary", isOverride = false, notes } = body;
    if (!teacherId) {
      return NextResponse.json(ResponseHelper.error("teacherId is required"), { status: 400 });
    }

    const assignment = await batchTeacherRepository.create({
      batch: id as any,
      teacher: teacherId,
      role,
      assignedAt: new Date(),
      assignedBy: userContext.userId,
      isOverride,
      notes,
      status: "active",
    });

    const batchUpdate: Record<string, any> = {};
    if (role === "primary") batchUpdate.primaryTeacher = teacherId;
    if (role === "assistant") batchUpdate.assistantTeacher = teacherId;
    if (role === "mentor") batchUpdate.mentor = teacherId;
    const mongoose = (await import("mongoose")).default;
    await mongoose.models.Batch.findByIdAndUpdate(id, batchUpdate);

    await batchTimelineRepository.create({
      batch: id as any,
      event: "teacher-assigned",
      description: `Teacher assigned as ${role}${isOverride ? " (manual override)" : ""}`,
      performedBy: userContext.userId as any,
      referenceId: teacherId as any,
      referenceType: "teacher",
    });

    return NextResponse.json(
      ResponseHelper.success("Teacher assigned to batch", assignment),
      { status: 201 }
    );
  })
);
