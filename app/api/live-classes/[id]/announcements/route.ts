
/**
 * @swagger
 * /api/live-classes/{id}/announcements:
 *   post:
 *     summary: Auto-generated summary for POST /api/live-classes/{id}/announcements
 *     tags: [live-classes]
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
 * /api/live-classes/{id}/announcements:
 *   get:
 *     summary: Auto-generated summary for GET /api/live-classes/{id}/announcements
 *     tags: [live-classes]
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
import { liveClassAnnouncementRepository } from "../../../../../repositories/live-class-announcement.repository";
import { AnnouncementService } from "../../../../../services/live-class/announcement.service";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Announcements for Live Class
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const announcements = await liveClassAnnouncementRepository.findMany({ liveClass: id }, { populate: ["sentBy"] });

    return NextResponse.json(ResponseHelper.success("Announcements fetched", announcements), { status: 200 });
  })
);

// POST Add Announcement
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const ann = await AnnouncementService.createAnnouncement({
      ...body,
      liveClass: id,
      sentBy: userContext.userId,
    });

    return NextResponse.json(ResponseHelper.success("Announcement posted successfully", ann), { status: 201 });
  })
);
