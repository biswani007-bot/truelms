
/**
 * @swagger
 * /api/assessments/{id}/attempts:
 *   get:
 *     summary: Auto-generated summary for GET /api/assessments/{id}/attempts
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
import { assessmentAttemptRepository } from "../../../../../repositories/assessment-attempt.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET attempts for assessment
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const attempts = await assessmentAttemptRepository.findMany({ assessment: id }, { populate: ["student"] });

    return NextResponse.json(ResponseHelper.success("Attempts roster fetched", attempts), { status: 200 });
  })
);
