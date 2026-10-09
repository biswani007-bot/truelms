
/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/attendance/{id}
 *     tags: [attendance]
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
 * /api/attendance/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/attendance/{id}
 *     tags: [attendance]
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
 * /api/attendance/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/attendance/{id}
 *     tags: [attendance]
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
import { attendanceRepository } from "../../../../repositories/attendance.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { AttendanceSummaryService } from "../../../../services/attendance/attendance-summary.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Attendance Record Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const record = await attendanceRepository.findById(id, {
      populate: ["student", "teacher", "liveClass", "batch"],
    });

    if (!record) {
      return NextResponse.json(ResponseHelper.error("Attendance record not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Attendance record fetched", record), { status: 200 });
  })
);

// PUT Update Attendance Record Detail
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, _userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const updated = await attendanceRepository.update(id, body);
    if (!updated) {
      return NextResponse.json(ResponseHelper.error("Attendance record not found"), { status: 404 });
    }

    // Refresh summary
    await AttendanceSummaryService.refreshSummary(updated.student.toString(), updated.batch.toString());

    return NextResponse.json(ResponseHelper.success("Attendance record updated", updated), { status: 200 });
  })
);

// DELETE Delete Attendance Record
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const deleted = await attendanceRepository.softDelete(id);
    if (!deleted) {
      return NextResponse.json(ResponseHelper.error("Attendance record not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Attendance record deleted", deleted), { status: 200 });
  })
);
