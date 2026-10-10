
/**
 * @swagger
 * /api/assignments/{id}/evaluate:
 *   post:
 *     summary: Auto-generated summary for POST /api/assignments/{id}/evaluate
 *     tags: [assignments]
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
import { EvaluationService } from "../../../../../services/assignment/evaluation.service";
import { AssignmentSubmission } from "../../../../../models/assignment-submission.model";
import { Assignment } from "../../../../../models/assignment.model";
import { AssignmentService } from "../../../../../services/assignment/assignment.service";

interface RouteParams {
  params: Promise<{ id: string }>; // id is submissionId here
}

// Teacher evaluates submission
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const { marksObtained, feedback, rubricScores } = body;
    if (marksObtained === undefined) {
      return NextResponse.json(ResponseHelper.error("marksObtained is required"), { status: 400 });
    }

    if (userContext?.role === "Teacher") {
      const submission = await AssignmentSubmission.findById(id);
      if (!submission) {
        return NextResponse.json(ResponseHelper.error("Submission not found", "NOT_FOUND"), { status: 404 });
      }
      const assignment = await Assignment.findById(submission.assignment);
      if (!assignment) {
        return NextResponse.json(ResponseHelper.error("Assignment profile not found", "NOT_FOUND"), { status: 404 });
      }
      const teacherContext = await AssignmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssignmentService.isTeacherAuthorized(
        assignment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to evaluate this submission", "FORBIDDEN"), { status: 403 });
      }
    }

    const evaluation = await EvaluationService.evaluate(
      id,
      { marksObtained, feedback, rubricScores },
      userContext.userId
    );

    return NextResponse.json(ResponseHelper.success("Submission evaluated successfully", evaluation), { status: 200 });
  })
);
