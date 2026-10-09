
/**
 * @swagger
 * /api/assignments/{id}/submit:
 *   post:
 *     summary: Auto-generated summary for POST /api/assignments/{id}/submit
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
import { SubmissionService } from "../../../../../services/assignment/submission.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Student submit assignment
export const POST = withRoles(
  ["Student"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const { files, links, comments } = body;
    if (!files || !links) {
      return NextResponse.json(ResponseHelper.error("files and links arrays are required"), { status: 400 });
    }

    const sub = await SubmissionService.submit(
      userContext.userId,
      id,
      files,
      links,
      comments
    );

    return NextResponse.json(ResponseHelper.success("Assignment submitted successfully", sub), { status: 201 });
  })
);
