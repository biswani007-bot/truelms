
/**
 * @swagger
 * /api/v1/public/portal-config:
 *   get:
 *     summary: Auto-generated summary for GET /api/v1/public/portal-config
 *     tags: [v1]
 *     
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
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PortalConfig } from "@/models";
import { IPortalConfig } from "@/models/portal-config.model";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get("portalId") || "student-portal";

    const config = await PortalConfig.findOne({ portalId, isDeleted: { $ne: true } }).lean<IPortalConfig>();

    if (!config) {
      return NextResponse.json({ error: `Portal configuration for '${portalId}' not found` }, { status: 404 });
    }

    if (config.status === "disabled") {
      return NextResponse.json({ error: "Portal is currently disabled by administrator", status: "disabled" }, { status: 403 });
    }

    // Exclude internal database IDs
    const { _id, __v, isDeleted, ...cleanConfig } = config as any;

    return NextResponse.json({
      success: true,
      portalId: cleanConfig.portalId,
      name: cleanConfig.name,
      status: cleanConfig.status,
      version: cleanConfig.version,
      minVersionRequired: cleanConfig.minVersionRequired,
      forceUpdate: cleanConfig.forceUpdate,
      maintenanceMessage: cleanConfig.maintenanceMessage,
      authSettings: cleanConfig.authSettings,
      featureFlags: cleanConfig.featureFlags,
      notificationSettings: cleanConfig.notificationSettings,
      branding: cleanConfig.branding,
      consentSettings: cleanConfig.consentSettings,
      mobileConfig: cleanConfig.mobileConfig,
      security: cleanConfig.security,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch portal configuration" }, { status: 500 });
  }
}
