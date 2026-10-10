
/**
 * @swagger
 * /api/assessments/{id}/publish:
 *   post:
 *     summary: Auto-generated summary for POST /api/assessments/{id}/publish
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
import { AssessmentService } from "../../../../../services/assessment/assessment.service";

import { Assessment } from "../../../../../models/assessment.model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const assessment: any = await Assessment.findById(id);
    if (!assessment) {
      return NextResponse.json(ResponseHelper.error("Assessment not found"), { status: 404 });
    }

    if (userContext.role === "Teacher") {
      const teacherContext = await AssessmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssessmentService.isTeacherAuthorized(
        assessment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to publish this assessment"), { status: 403 });
      }
    }

    const updated = await AssessmentService.publishAssessment(id, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Assessment published successfully", updated), { status: 200 });
  })
);
