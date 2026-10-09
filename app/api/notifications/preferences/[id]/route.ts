
/**
 * @swagger
 * /api/notifications/preferences/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/notifications/preferences/{id}
 *     tags: [notifications]
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

/**
 * @swagger
 * /api/notifications/preferences/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/notifications/preferences/{id}
 *     tags: [notifications]
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { PreferenceService } from "../../../../../services/notification/preference.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params; // Admin can specify recipient userId directly
    const prefs = await PreferenceService.getPreferences(id);
    return NextResponse.json(ResponseHelper.success("Notification preferences fetched", prefs));
  })
);

export const PUT = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();
    const updated = await PreferenceService.updatePreferences(id, body);
    return NextResponse.json(ResponseHelper.success("Notification preferences updated", updated));
  })
);
