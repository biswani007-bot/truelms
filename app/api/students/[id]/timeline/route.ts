
/**
 * @swagger
 * /api/students/{id}/timeline:
 *   get:
 *     summary: Auto-generated summary for GET /api/students/{id}/timeline
 *     tags: [students]
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
import { studentTimelineRepository } from "../../../../../repositories/student-timeline.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

// GET Timeline Logs
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Read Only"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const timeline = await studentTimelineRepository.findMany({ student: id }, { sort: "timestamp", order: "desc" } as any);
    return NextResponse.json(ResponseHelper.success("Fetched student timeline history", timeline), { status: 200 });
  })
);
