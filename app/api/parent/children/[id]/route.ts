/**
 * @swagger
 * /api/parent/children/{id}:
 *   get:
 *     summary: Retrieve child profile linked to authenticated parent
 *     tags: [parent]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Child profile retrieved successfully
 *       403:
 *         description: Forbidden - child not linked to authenticated parent
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update child profile linked to authenticated parent
 *     tags: [parent]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               schoolCollege:
 *                 type: string
 *               relationshipType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Child profile updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - child not linked to authenticated parent
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Remove a child from the authenticated parent profile
 *     tags: [parent]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Child removed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const GET = apiHandler(async (req: NextRequest, context: any) => {
  const { parent } = await getAuthenticatedParent(req);
  const { id } = await context.params;

  const child = await ParentService.getChild(parent._id, id);
  return NextResponse.json(ApiResponse.success("Child profile retrieved successfully", child));
});

export const PUT = apiHandler(async (req: NextRequest, context: any) => {
  const { parent } = await getAuthenticatedParent(req);
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  const updatedChild = await ParentService.updateChild(parent._id, id, body);
  return NextResponse.json(ApiResponse.success("Child profile updated successfully", updatedChild));
});

export const PATCH = PUT;

export const DELETE = apiHandler(async (req: NextRequest, context: any) => {
  const { parent } = await getAuthenticatedParent(req);
  const { id } = await context.params;

  await ParentService.removeChild(parent._id, id);

  return NextResponse.json(ApiResponse.success("Child removed successfully"));
});
