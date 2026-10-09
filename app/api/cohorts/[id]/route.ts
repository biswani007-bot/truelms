
/**
 * @swagger
 * /api/cohorts/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/cohorts/{id}
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

/**
 * @swagger
 * /api/cohorts/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/cohorts/{id}
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

/**
 * @swagger
 * /api/cohorts/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/cohorts/{id}
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { cohortRepository } from "../../../../repositories/cohort.repository";
import { cohortTimelineRepository } from "../../../../repositories/cohort-timeline.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";

// GET Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Read Only"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const cohort = await cohortRepository.findById(id, { populate: ["course", "academicSession", "primaryInstructor"] });
    if (!cohort) {
      return NextResponse.json(ResponseHelper.error("Cohort profile not found", "NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Fetched cohort profile details", cohort), { status: 200 });
  })
);

// PUT Update
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const oldCohort = await cohortRepository.findById(id);
    if (!oldCohort) {
      return NextResponse.json(ResponseHelper.error("Cohort profile not found", "NOT_FOUND"), { status: 404 });
    }

    const updated = await cohortRepository.update(id, body);

    // Audit Timeline updates on status adjustments
    if (body.status && body.status !== oldCohort.status) {
      await cohortTimelineRepository.create({
        cohort: id,
        event: "status_change",
        description: `Cohort status updated from ${oldCohort.status} to ${body.status}`,
      });
    }

    return NextResponse.json(ResponseHelper.success("Cohort profile details updated", updated), { status: 200 });
  })
);

// DELETE Soft Delete
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const result = await cohortRepository.softDelete(id);
    return NextResponse.json(ResponseHelper.success("Cohort profile archived successfully", result), { status: 200 });
  })
);
