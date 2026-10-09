
/**
 * @swagger
 * /api/teachers/{id}/leaves:
 *   post:
 *     summary: Auto-generated summary for POST /api/teachers/{id}/leaves
 *     tags: [teachers]
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
 * /api/teachers/{id}/leaves:
 *   get:
 *     summary: Auto-generated summary for GET /api/teachers/{id}/leaves
 *     tags: [teachers]
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
import { teacherLeaveRepository } from "../../../../../repositories/teacher-leave.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

// GET Leave Logs
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const leaves = await teacherLeaveRepository.findMany({ teacher: id });
    return NextResponse.json(ResponseHelper.success("Fetched teacher leaves", leaves), { status: 200 });
  })
);

// POST Submit Leave Request
export const POST = withRoles(
  ["Admin", "Super Admin", "Teacher"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const leave = await teacherLeaveRepository.create({
      ...body,
      teacher: id,
      status: "pending",
    });

    return NextResponse.json(ResponseHelper.success("Teacher leave requested successfully", leave), { status: 201 });
  })
);
