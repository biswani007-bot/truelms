/**
 * @swagger
 * /api/parent/children/{id}/assignments/{assignmentId}/submit:
 *   post:
 *     summary: Submit coursework on behalf of an authorized child
 *     tags: [parent]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID (Child)
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *               links:
 *                 type: array
 *                 items:
 *                   type: string
 *               comments:
 *                 type: string
 *     responses:
 *       201:
 *         description: Assignment submitted successfully
 *       400:
 *         description: Validation error or max attempts reached
 *       403:
 *         description: Unauthorized access to child or batch
 *       404:
 *         description: Child or assignment not found
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const POST = apiHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string; assignmentId: string }> }
  ) => {
    const { id, assignmentId } = await params;
    const { parent } = await getAuthenticatedParent(req);

    const body = await req.json().catch(() => ({}));
    const { files = [], links = [], comments } = body;

    const submission = await ParentService.submitChildAssignment(
      parent._id,
      id,
      assignmentId,
      {
        files,
        links,
        comments,
      }
    );

    return NextResponse.json(
      ApiResponse.success("Assignment submitted successfully", submission),
      { status: 201 }
    );
  }
);
