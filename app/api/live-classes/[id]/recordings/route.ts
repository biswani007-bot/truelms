
/**
 * @swagger
 * /api/live-classes/{id}/recordings:
 *   post:
 *     summary: Auto-generated summary for POST /api/live-classes/{id}/recordings
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
 * /api/live-classes/{id}/recordings:
 *   get:
 *     summary: Auto-generated summary for GET /api/live-classes/{id}/recordings
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { liveClassRecordingRepository } from "../../../../../repositories/live-class-recording.repository";
import { liveClassRepository } from "../../../../../repositories/live-class.repository";
import { studentRepository } from "../../../../../repositories/student.repository";
import { teacherRepository } from "../../../../../repositories/teacher.repository";
import { batchStudentRepository } from "../../../../../repositories/batch-student.repository";
import { BatchTeacher } from "../../../../../models/batch-teacher.model";
import { RecordingService } from "../../../../../services/live-class/recording.service";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Recordings for Live Class with strict batch ownership checks
export const GET = withRoles(
  ["Admin", "Super Admin", "SuperAdmin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const liveClass = await liveClassRepository.findById(id);
    if (!liveClass) {
      return NextResponse.json({ error: "Live class not found" }, { status: 404 });
    }

    const roles = userContext.roles || [];
    const isStudent = roles.includes("Student");
    const isTeacher = roles.includes("Teacher");
    const isAdmin = roles.includes("Admin") || roles.includes("Super Admin") || roles.includes("SuperAdmin");

    if (isStudent && !isAdmin) {
      const student = await studentRepository.findOne({ user: userContext.userId });
      if (!student) {
        return NextResponse.json({ error: "Student record not found" }, { status: 403 });
      }
      const enrollment = await batchStudentRepository.findOne({
        batch: liveClass.batch,
        student: student._id,
        status: "active",
      });
      if (!enrollment) {
        return NextResponse.json(
          { error: "Access Denied: You are not authorized to view this recording." },
          { status: 403 }
        );
      }
    } else if (isTeacher && !isAdmin) {
      const teacher = await teacherRepository.findOne({ user: userContext.userId });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher record not found" }, { status: 403 });
      }
      const isDirectTeacher =
        liveClass.teacher?.toString() === teacher._id.toString() ||
        liveClass.assistantTeacher?.toString() === teacher._id.toString() ||
        liveClass.mentor?.toString() === teacher._id.toString();

      let isAssignedBatch = false;
      if (!isDirectTeacher && liveClass.batch) {
        const bt = await BatchTeacher.findOne({ batch: liveClass.batch, teacher: teacher._id, status: "active" });
        if (bt) isAssignedBatch = true;
      }
      if (!isDirectTeacher && !isAssignedBatch) {
        return NextResponse.json(
          { error: "Access Denied: You are not assigned to this cohort's lectures." },
          { status: 403 }
        );
      }
    }

    const recording = await liveClassRecordingRepository.findOne({ liveClass: id });

    return NextResponse.json(
      ResponseHelper.success("Recording details fetched", recording),
      { status: 200 }
    );
  })
);

// POST Register Recording url / session data
export const POST = withRoles(
  ["Admin", "Super Admin", "SuperAdmin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const recording = await RecordingService.publishRecording(id, body, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Recording published successfully", recording),
      { status: 201 }
    );
  })
);
