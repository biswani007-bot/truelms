
/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Auto-generated summary for PUT /api/admin/settings
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

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/settings
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { settingsRepository } from "../../../../repositories/settings.repository";
import { SettingsUpdateSchema } from "../../../../dtos/settings.dto";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { ActivityLog } from "../../../../models/activity-log.model";
import { connectDB } from "../../../../config/db";

// GET Settings
export const GET = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async () => {
    await connectDB();
    let settings = await settingsRepository.getGlobalSettings();
    if (!settings) {
      // Return defaults by seeding a new document
      settings = await settingsRepository.updateGlobalSettings({});
    }


    // Mask secret keys before sending to the client
    const safeSettings = JSON.parse(JSON.stringify(settings));
    if (safeSettings.payment?.gateways) {
      safeSettings.payment.gateways = safeSettings.payment.gateways.map((g: any) => ({
        ...g,
        secretKey: g.secretKey ? "********" : "",
      }));
    }
    return NextResponse.json(ResponseHelper.success("Fetched settings successfully", safeSettings),
      { status: 200 }
    );
  })
);

// PUT Settings
export const PUT = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    // DTO Validation
    const validatedData = SettingsUpdateSchema.parse(body);

    // If the UI sends back the masked secretKey, preserve the original one
    if (validatedData.payment?.gateways) {
      const existingSettings = await settingsRepository.getGlobalSettings();
      if (existingSettings?.payment?.gateways) {
        validatedData.payment.gateways = validatedData.payment.gateways.map((g: any) => {
          if (g.secretKey === "********") {
            const existingGateway = existingSettings.payment!.gateways.find(eg => eg.provider === g.provider);
            if (existingGateway) {
              g.secretKey = existingGateway.secretKey;
            }
          }
          return g;
        });
      }
    }

    const updated = await settingsRepository.updateGlobalSettings(validatedData);

    // Audit Logging
    await ActivityLog.create({
      user: userContext.userId || undefined,
      role: userContext.role,
      action: "UPDATE",
      entity: "Settings",
      entityId: updated?._id?.toString(),
      metadata: {
        message: "Platform settings updated by administrator",
        updates: Object.keys(validatedData),
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      ResponseHelper.success("Updated settings successfully", updated),
      { status: 200 }
    );
  })
);
