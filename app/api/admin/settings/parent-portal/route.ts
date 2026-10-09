
/**
 * @swagger
 * /api/admin/settings/parent-portal:
 *   put:
 *     summary: Auto-generated summary for PUT /api/admin/settings/parent-portal
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
 * /api/admin/settings/parent-portal:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/settings/parent-portal
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
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Settings } from "@/models";
import { ISettings } from "@/models/settings.model";
import { authenticateRequest } from "@/middleware/auth.middleware";

export async function GET(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    let settings = await Settings.findOne({ key: "global" }).lean<ISettings>();
    if (!settings) {
      settings = await Settings.create({ key: "global" });
    }

    return NextResponse.json({
      success: true,
      data: settings?.parentPortal || {
        attendanceVisibility: true,
        homeworkVisibility: true,
        assessmentVisibility: true,
        gradeVisibility: true,
        feeVisibility: true,
        paymentVisibility: true,
        certificatesVisibility: true,
        timetableVisibility: true,
        calendarVisibility: true,
        announcementsVisibility: true,
        teacherMessagingEnabled: true,
        leaveRequestsEnabled: true,
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        downloadPermissions: true,
        reportCardPermissions: true,
        documentPermissions: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch portal config" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const settings = await Settings.findOneAndUpdate(
      { key: "global" },
      { $set: { parentPortal: body } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: settings.parentPortal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update portal config" }, { status: 500 });
  }
}
