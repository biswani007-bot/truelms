
/**
 * @swagger
 * /api/enrollments/{id}/timeline:
 *   get:
 *     summary: Auto-generated summary for GET /api/enrollments/{id}/timeline
 *     tags: [enrollments]
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
import { enrollmentTimelineRepository } from "../../../../../repositories/enrollment-timeline.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

// GET Timeline Logs
export const GET = withRoles(
  ["Admin", "Super Admin", "Admissions Manager", "Counsellor", "Student", "Read Only"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const timeline = await enrollmentTimelineRepository.findMany({ enrollment: id }, { sort: "timestamp", order: "desc" } as any);
    return NextResponse.json(ResponseHelper.success("Fetched enrollment workflow timeline", timeline), { status: 200 });
  })
);
