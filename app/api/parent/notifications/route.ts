
/**
 * @swagger
 * /api/parent/notifications:
 *   get:
 *     summary: Auto-generated summary for GET /api/parent/notifications
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

export const GET = apiHandler(async (req: NextRequest) => {
  const { user } = await getAuthenticatedParent(req);
  const notifications = await ParentService.getParentNotifications(user.userId);
  return NextResponse.json(ApiResponse.success("Parent notifications retrieved successfully", notifications));
});
