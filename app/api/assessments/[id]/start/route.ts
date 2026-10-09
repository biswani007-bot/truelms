
/**
 * @swagger
 * /api/assessments/{id}/start:
 *   post:
 *     summary: Auto-generated summary for POST /api/assessments/{id}/start
 *     tags: [assessments]
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
import { AttemptService } from "../../../../../services/assessment/attempt.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = apiHandler(async (req: NextRequest, arg2: any, arg3?: any) => {
    await connectDB();
    const context = (arg3 && arg3.params) ? arg3 : (arg2 && arg2.params ? arg2 : null);
    const rawParams = context ? (context.params instanceof Promise ? await context.params : context.params) : {};
    const id = rawParams?.id;

    if (!id) {
      return NextResponse.json(ResponseHelper.error("Assessment ID is required"), { status: 400 });
    }

    const { verifyAuth } = await import("../../../../../middleware/auth.middleware");
    const normalUser = verifyAuth(req);
    let studentId;
    
    if (normalUser && normalUser.role?.toLowerCase() === "student") {
      const { Student } = await import("../../../../../models/student.model");
      const s = await Student.findOne({ user: normalUser.userId });
      if (!s) return NextResponse.json(ResponseHelper.error("Student profile not found"), { status: 404 });
      studentId = s._id.toString();
    } else {
      const { verifyAssessmentAccess } = await import("../../../../../lib/auth/assessment-runner-auth");
      const access = await verifyAssessmentAccess(req, id);
      if (!access) {
        return NextResponse.json(ResponseHelper.error("Not authorized to start this assessment"), { status: 403 });
      }
      studentId = access.studentId;
    }

    const attempt = await AttemptService.startAttempt(studentId, id);
    if (!attempt) {
      return NextResponse.json(ResponseHelper.error("Could not start attempt or assessment already completed"), { status: 400 });
    }

    return NextResponse.json(ResponseHelper.success("Assessment started", attempt), { status: 201 });
  });
