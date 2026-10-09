
/**
 * @swagger
 * /api/teachers/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/teachers/{id}
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
 * /api/teachers/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/teachers/{id}
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
 * /api/teachers/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/teachers/{id}
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { teacherRepository } from "../../../../repositories/teacher.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";

// GET Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const teacher = await teacherRepository.findById(id, { populate: "user" });
    if (!teacher) {
      return NextResponse.json(ResponseHelper.error("Teacher profile not found", "NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Fetched teacher profile details", teacher), { status: 200 });
  })
);

// PUT Update
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const updated = await teacherRepository.update(id, body);
    return NextResponse.json(ResponseHelper.success("Teacher profile details updated", updated), { status: 200 });
  })
);

// DELETE Soft Delete
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const result = await teacherRepository.softDelete(id);
    return NextResponse.json(ResponseHelper.success("Teacher profile archived successfully", result), { status: 200 });
  })
);
