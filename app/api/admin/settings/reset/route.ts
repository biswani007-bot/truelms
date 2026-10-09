
/**
 * @swagger
 * /api/admin/settings/reset:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/settings/reset
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { Settings } from "../../../../../models/settings.model";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { ActivityLog } from "../../../../../models/activity-log.model";
import { connectDB } from "../../../../../config/db";

// POST Reset Settings
export const POST = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();

    // Remove existing settings configuration
    await Settings.deleteMany({ key: "global" });

    // Initialize brand new settings document with schema defaults
    const defaultSettings = new Settings({ key: "global" });
    await defaultSettings.save();

    // Audit Logging
    await ActivityLog.create({
      user: userContext.userId || undefined,
      role: userContext.role,
      action: "RESET",
      entity: "Settings",
      entityId: defaultSettings._id?.toString(),
      metadata: {
        message: "Platform settings reset to default values by administrator",
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      ResponseHelper.success("Settings reset to defaults successfully", defaultSettings),
      { status: 200 }
    );
  })
);
