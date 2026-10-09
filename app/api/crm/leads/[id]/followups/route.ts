
/**
 * @swagger
 * /api/crm/leads/{id}/followups:
 *   post:
 *     summary: Auto-generated summary for POST /api/crm/leads/{id}/followups
 *     tags: [crm]
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
 * /api/crm/leads/{id}/followups:
 *   get:
 *     summary: Auto-generated summary for GET /api/crm/leads/{id}/followups
 *     tags: [crm]
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
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { leadFollowUpRepository } from "../../../../../../repositories/lead-followup.repository";
import { leadTimelineRepository } from "../../../../../../repositories/lead-timeline.repository";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";

export const GET = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const followUps = await leadFollowUpRepository.findMany({ lead: id }, { populate: "assignedUser" });
    return NextResponse.json(ResponseHelper.success("Fetched follow-ups", followUps), { status: 200 });
  })
);

export const POST = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const followup = await leadFollowUpRepository.create({
      ...body,
      lead: id,
    });

    // Log to Timeline
    await leadTimelineRepository.create({
      lead: id,
      event: "follow_up",
      description: `Follow-up logged via ${followup.mode}. Outcome: ${followup.outcome}`,
    });

    return NextResponse.json(ResponseHelper.success("Follow-up logged successfully", followup), { status: 201 });
  })
);
