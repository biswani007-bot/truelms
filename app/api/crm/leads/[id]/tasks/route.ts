
/**
 * @swagger
 * /api/crm/leads/{id}/tasks:
 *   post:
 *     summary: Auto-generated summary for POST /api/crm/leads/{id}/tasks
 *     tags: [crm]
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
 * /api/crm/leads/{id}/tasks:
 *   get:
 *     summary: Auto-generated summary for GET /api/crm/leads/{id}/tasks
 *     tags: [crm]
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
import { leadTaskRepository } from "../../../../../../repositories/lead-task.repository";
import { leadTimelineRepository } from "../../../../../../repositories/lead-timeline.repository";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";

export const GET = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const tasks = await leadTaskRepository.findMany({ lead: id }, { populate: "assignedUser" });
    return NextResponse.json(ResponseHelper.success("Fetched tasks", tasks), { status: 200 });
  })
);

export const POST = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const task = await leadTaskRepository.create({
      ...body,
      lead: id,
    });

    // Log to Timeline
    await leadTimelineRepository.create({
      lead: id,
      event: "task_created",
      description: `Task created: ${task.title}. Priority: ${task.priority}`,
    });

    return NextResponse.json(ResponseHelper.success("Task created successfully", task), { status: 201 });
  })
);
