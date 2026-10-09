
/**
 * @swagger
 * /api/enrollments/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/enrollments/{id}
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

/**
 * @swagger
 * /api/enrollments/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/enrollments/{id}
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

/**
 * @swagger
 * /api/enrollments/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/enrollments/{id}
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { enrollmentRepository } from "../../../../repositories/enrollment.repository";
import { enrollmentTimelineRepository } from "../../../../repositories/enrollment-timeline.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { CertificateService } from "../../../../services/certificate/certificate.service";

// GET Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Admissions Manager", "Counsellor", "Student", "Read Only"],
  apiHandler(async (req: NextRequest, arg1: any, arg2?: any) => {
    await connectDB();
    const segmentData = (arg2 && arg2.params) ? arg2 : arg1;
    const params = await segmentData.params;
    const { id } = params;

    const enrollment = await enrollmentRepository.findById(id, { populate: ["student", "course", "admissionCounselor"] });
    if (!enrollment) {
      return NextResponse.json(ResponseHelper.error("Enrollment record not found", "NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Fetched enrollment details", enrollment), { status: 200 });
  })
);

// PUT Update
export const PUT = withRoles(
  ["Admin", "Super Admin", "Admissions Manager", "Counsellor"],
  apiHandler(async (req: NextRequest, arg1: any, arg2?: any) => {
    await connectDB();
    const segmentData = (arg2 && arg2.params) ? arg2 : arg1;
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const oldEnrollment = await enrollmentRepository.findById(id);
    if (!oldEnrollment) {
      return NextResponse.json(ResponseHelper.error("Enrollment record not found", "NOT_FOUND"), { status: 404 });
    }

    const updated = await enrollmentRepository.update(id, body);

    // Audit Timeline updates on status adjustments
    if (body.status && body.status !== oldEnrollment.status) {
      await enrollmentTimelineRepository.create({
        enrollment: id,
        event: body.status,
        description: `Enrollment status transitioned from ${oldEnrollment.status} to ${body.status}`,
      });

      if (body.status === "completed") {
        try {
          await CertificateService.onCourseCompletion(id);
        } catch (certErr) {
          console.error("Error triggering certificate on completion:", certErr);
        }
      }
    }

    return NextResponse.json(ResponseHelper.success("Enrollment updated successfully", updated), { status: 200 });
  })
);

// DELETE Soft Delete
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, arg1: any, arg2?: any) => {
    await connectDB();
    const segmentData = (arg2 && arg2.params) ? arg2 : arg1;
    const params = await segmentData.params;
    const { id } = params;

    const result = await enrollmentRepository.softDelete(id);
    return NextResponse.json(ResponseHelper.success("Enrollment archived successfully", result), { status: 200 });
  })
);
