
/**
 * @swagger
 * /api/teachers/{id}/availability:
 *   post:
 *     summary: Auto-generated summary for POST /api/teachers/{id}/availability
 *     tags: [teachers]
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
 * /api/teachers/{id}/availability:
 *   get:
 *     summary: Auto-generated summary for GET /api/teachers/{id}/availability
 *     tags: [teachers]
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
import { teacherAvailabilityRepository } from "../../../../../repositories/teacher-availability.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

// GET Availability schedule
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Read Only"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    let availability = await teacherAvailabilityRepository.findOne({ teacher: id });
    if (!availability) {
      availability = await teacherAvailabilityRepository.create({
        teacher: id,
        weeklySchedule: [],
        maxWeeklyHours: 40,
        maxDailyHours: 8,
      });
    }

    return NextResponse.json(ResponseHelper.success("Fetched availability schedule", availability), { status: 200 });
  })
);

// POST Update Availability
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    let availability = await teacherAvailabilityRepository.findOne({ teacher: id });
    if (!availability) {
      availability = await teacherAvailabilityRepository.create({
        teacher: id,
        ...body,
      });
    } else {
      availability = await teacherAvailabilityRepository.update((availability._id as any).toString(), body);
    }

    return NextResponse.json(ResponseHelper.success("Teacher availability updated successfully", availability), { status: 200 });
  })
);
