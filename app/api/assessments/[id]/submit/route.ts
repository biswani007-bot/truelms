
/**
 * @swagger
 * /api/assessments/{id}/submit:
 *   post:
 *     summary: Auto-generated summary for POST /api/assessments/{id}/submit
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
  params: Promise<{ id: string }>; // attemptId here
}

export const POST = apiHandler(async (arg1: NextRequest, arg2: any, arg3: any) => {
    const req = arg1;
    const context = arg3?.params ? arg3 : (arg2?.params ? arg2 : null);
    await connectDB();
    const { id } = await context.params; // attemptId
    const body = await req.json();

    const { AssessmentAttempt } = await import("../../../../../models/assessment-attempt.model");
    const attemptRecord = await AssessmentAttempt.findById(id);
    if (!attemptRecord) return NextResponse.json(ResponseHelper.error("Attempt not found"), { status: 404 });

    const assessmentId = attemptRecord.assessment.toString();

    const { verifyAuth } = await import("../../../../../middleware/auth.middleware");
    const normalUser = verifyAuth(req);
    let isAuthorized = false;
    
    if (normalUser && normalUser.role?.toLowerCase() === "student") {
      const { Student } = await import("../../../../../models/student.model");
      const s = await Student.findOne({ user: normalUser.userId });
      if (s && s._id.toString() === attemptRecord.student.toString()) {
        isAuthorized = true;
      }
    } else {
      const { verifyAssessmentAccess } = await import("../../../../../lib/auth/assessment-runner-auth");
      const access = await verifyAssessmentAccess(req, assessmentId);
      if (access && access.studentId === attemptRecord.student.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(ResponseHelper.error("Not authorized to submit this attempt"), { status: 403 });
    }

    const { answers, autoSubmitted } = body;
    if (!answers) {
      return NextResponse.json(ResponseHelper.error("answers array is required"), { status: 400 });
    }

    const updated = await AttemptService.submitAttempt(id, answers, autoSubmitted);
    
    // Clear cookie if proxy token was used
    let response = NextResponse.json(ResponseHelper.success("Assessment submitted successfully", updated), { status: 200 });
    const proxyToken = req.cookies.get("assessment_proxy_token")?.value;
    if (proxyToken) {
       response.cookies.delete("assessment_proxy_token");
    }

    return response;
  });
