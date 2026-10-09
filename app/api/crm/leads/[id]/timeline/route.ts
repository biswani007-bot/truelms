
/**
 * @swagger
 * /api/crm/leads/{id}/timeline:
 *   get:
 *     summary: Auto-generated summary for GET /api/crm/leads/{id}/timeline
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

    const timeline = await leadTimelineRepository.findMany({ lead: id }, { populate: "performedBy", sort: "timestamp", order: "asc" } as any);
    return NextResponse.json(ResponseHelper.success("Fetched timeline", timeline), { status: 200 });
  })
);
