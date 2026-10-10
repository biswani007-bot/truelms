
/**
 * @swagger
 * /api/assignments/{id}/submissions:
 *   get:
 *     summary: Auto-generated summary for GET /api/assignments/{id}/submissions
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
import { assignmentSubmissionRepository } from "../../../../../repositories/assignment-submission.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { AcademicResolver } from "../../../../../services/academic/academic.service";
import { Assignment } from "../../../../../models/assignment.model";
import { AssignmentService } from "../../../../../services/assignment/assignment.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

import { studentRepository } from "../../../../../repositories/student.repository";

// GET Submissions roster for assignment
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    if (userContext.role === "Teacher") {
      const assignment: any = await Assignment.findById(id);
      if (!assignment) {
        return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
      }
      const teacherContext = await AssignmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssignmentService.isTeacherAuthorized(
        assignment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to view submissions for this assignment", "FORBIDDEN"), { status: 403 });
      }
    }

    const query: Record<string, any> = { assignment: id };

    if (userContext.role === "Student") {
      let resolvedStudentId = userContext.userId;
      const studentDoc = await studentRepository.findOne({ user: userContext.userId });
      if (studentDoc) {
        resolvedStudentId = studentDoc._id.toString();
      }
      query.student = resolvedStudentId;
    }

    const submissions = await assignmentSubmissionRepository.findMany(
      query,
      { populate: ["student"] }
    );

    return NextResponse.json(ResponseHelper.success("Submissions fetched", submissions.map((s: any) => AcademicResolver.resolveSubmission(s))), { status: 200 });
  })
);
