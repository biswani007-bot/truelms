
/**
 * @swagger
 * /api/assignments/{id}/publish:
 *   post:
 *     summary: Auto-generated summary for POST /api/assignments/{id}/publish
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
import { Assignment } from "../../../../../models/assignment.model";
import { AssignmentService } from "../../../../../services/assignment/assignment.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const assignment: any = await Assignment.findById(id);
    if (!assignment) {
      return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
    }

    if (userContext?.role === "Teacher") {
      const teacherContext = await AssignmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssignmentService.isTeacherAuthorized(
        assignment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to publish this assignment", "FORBIDDEN"), { status: 403 });
      }
    }

    const updated = await AssignmentService.publishAssignment(id, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Assignment published successfully", updated), { status: 200 });
  })
);
