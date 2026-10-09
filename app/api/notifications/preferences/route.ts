
/**
 * @swagger
 * /api/notifications/preferences:
 *   post:
 *     summary: Auto-generated summary for POST /api/notifications/preferences
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
 * /api/notifications/preferences:
 *   get:
 *     summary: Auto-generated summary for GET /api/notifications/preferences
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
import { withAuth } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { connectDB } from "../../../../config/db";
import { PreferenceService } from "../../../../services/notification/preference.service";

export const GET = withAuth(
  async (req: NextRequest, user) => {
    await connectDB();
    const prefs = await PreferenceService.getPreferences(user.userId);
    return NextResponse.json(ResponseHelper.success("Notification preferences fetched", prefs));
  }
);

export const POST = withAuth(
  async (req: NextRequest, user) => {
    await connectDB();
    const body = await req.json();
    const updated = await PreferenceService.updatePreferences(user.userId, body);
    return NextResponse.json(ResponseHelper.success("Notification preferences updated", updated));
  }
);
