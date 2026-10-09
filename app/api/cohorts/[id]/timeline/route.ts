
/**
 * @swagger
 * /api/cohorts/{id}/timeline:
 *   get:
 *     summary: Auto-generated summary for GET /api/cohorts/{id}/timeline
 *     tags: [cohorts]
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
import { cohortTimelineRepository } from "../../../../../repositories/cohort-timeline.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

// GET Timeline Logs
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Read Only"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const timeline = await cohortTimelineRepository.findMany({ cohort: id }, { sort: "timestamp", order: "desc" } as any);
    return NextResponse.json(ResponseHelper.success("Fetched cohort timeline history", timeline), { status: 200 });
  })
);
