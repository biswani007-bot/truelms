
/**
 * @swagger
 * /api/parent/children/{id}/assessments:
 *   get:
 *     summary: Auto-generated summary for GET /api/parent/children/{id}/assessments
 *     tags: [parent]
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
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { parent } = await getAuthenticatedParent(req);
  const assessments = await ParentService.getChildAssessments(parent._id, id);
  return NextResponse.json(ApiResponse.success("Child assessments retrieved successfully", assessments));
});
