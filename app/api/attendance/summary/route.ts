
/**
 * @swagger
 * /api/attendance/summary:
 *   get:
 *     summary: Auto-generated summary for GET /api/attendance/summary
 *     tags: [attendance]
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
import { attendanceSummaryRepository } from "../../../../repositories/attendance-summary.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";

// GET Student attendance summaries
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const url = new URL(req.url);
    const student = url.searchParams.get("student");
    const batch = url.searchParams.get("batch");

    const query: any = {};
    if (student) query.student = student;
    if (batch) query.batch = batch;

    const summaries = await attendanceSummaryRepository.findMany(query, { populate: ["student", "batch"] });

    return NextResponse.json(ResponseHelper.success("Attendance summaries fetched", summaries), { status: 200 });
  })
);
