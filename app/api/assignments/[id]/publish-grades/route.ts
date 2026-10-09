
/**
 * @swagger
 * /api/assignments/{id}/publish-grades:
 *   post:
 *     summary: Auto-generated summary for POST /api/assignments/{id}/publish-grades
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Publish grades for all evaluated assignments
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const result = await EvaluationService.publishGrades(id, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Grades published successfully", result), { status: 200 });
  })
);
