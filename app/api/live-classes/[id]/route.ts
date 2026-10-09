
/**
 * @swagger
 * /api/live-classes/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/live-classes/{id}
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

/**
 * @swagger
 * /api/live-classes/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/live-classes/{id}
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

/**
 * @swagger
 * /api/live-classes/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/live-classes/{id}
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { liveClassRepository } from "../../../../repositories/live-class.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Live Class Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const liveClass = await liveClassRepository.findById(id, {
      populate: ["batch", "course", "teacher", "assistantTeacher", "mentor"],
    });

    if (!liveClass) {
      return NextResponse.json(ResponseHelper.error("Live class not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Live class fetched", liveClass), { status: 200 });
  })
);

// PUT Update Live Class Details
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, _userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const updated = await liveClassRepository.update(id, body);
    if (!updated) {
      return NextResponse.json(ResponseHelper.error("Live class not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Live class updated", updated), { status: 200 });
  })
);

// DELETE Soft-delete Live Class
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const mongoose = require("mongoose");
    const Attendance = mongoose.models.Attendance;
    const LiveClassRecording = mongoose.models.LiveClassRecording;
    const LiveClass = mongoose.models.LiveClass;

    const attendanceRecords = await Attendance.countDocuments({ liveClass: id, status: { $ne: "absent" } });
    const recordings = await LiveClassRecording.countDocuments({ liveClass: id });

    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      return NextResponse.json(ResponseHelper.error("Live class not found"), { status: 404 });
    }

    if (attendanceRecords > 0 || recordings > 0 || liveClass.status === "completed") {
      // Safe Archive due to historical records
      const archived = await liveClassRepository.softDelete(id);
      await LiveClass.findByIdAndUpdate(id, { status: "archived" });
      return NextResponse.json(ResponseHelper.success("Session archived due to historical dependencies.", archived), { status: 200 });
    }

    // Hard delete since safe
    const deleted = await LiveClass.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(ResponseHelper.error("Live class not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Live class archived", deleted), { status: 200 });
  })
);
