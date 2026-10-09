
/**
 * @swagger
 * /api/parent/children:
 *   get:
 *     summary: Auto-generated summary for GET /api/parent/children
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
 *                   type: array
 *   post:
 *     summary: Add child to authenticated parent profile
 *     tags: [parent]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               relationshipType:
 *                 type: string
 *                 enum: [father, mother, guardian, foster, other]
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               dob:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Child added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const GET = apiHandler(async (req: NextRequest) => {
  const { parent } = await getAuthenticatedParent(req);
  const children = await ParentService.getLinkedChildren(parent._id);
  return NextResponse.json(ApiResponse.success("Linked children retrieved successfully", children));
});

export const POST = apiHandler(async (req: NextRequest) => {
  const { parent } = await getAuthenticatedParent(req);
  const body = await req.json().catch(() => ({}));

  const child = await ParentService.addChild(parent._id, {
    firstName: body.firstName,
    middleName: body.middleName,
    lastName: body.lastName,
    relationshipType: body.relationshipType,
    gender: body.gender,
    dob: body.dob,
    phone: body.phone,
    city: body.city,
    state: body.state,
    country: body.country,
    schoolCollege: body.schoolCollege,
  });

  return NextResponse.json(ApiResponse.success("Child added successfully", child), { status: 201 });
});

