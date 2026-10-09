
/**
 * @swagger
 * /api/admin/security/revoke-session:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/security/revoke-session
 *     tags: [admin]
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
import { connectDB } from "../../../../../config/db";
import { userRepository } from "../../../../../repositories/user.repository";
import { ActivityLog } from "../../../../../models/activity-log.model";

export const POST = withRoles(
  ["Admin", "Super Admin"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const body = await req.json();
      const { userId, reason } = body;

      if (!userId) {
        return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
      }

      // We clear the refreshToken effectively terminating the session 
      // when the short-lived access token expires.
      await userRepository.update(userId, { refreshToken: "" });

      // Log the action
      await ActivityLog.create({
        action: "FORCE_LOGOUT",
        entity: "User",
        entityId: userId,
        metadata: { reason },
        timestamp: new Date()
      });

      return NextResponse.json({ success: true, message: "User session revoked successfully." });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
);
