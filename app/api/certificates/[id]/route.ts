/**
 * @swagger
 * /api/certificates/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/certificates/{id}
 *     tags: [certificates]
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
 * /api/certificates/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/certificates/{id}
 *     tags: [certificates]
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
 * /api/certificates/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/certificates/{id}
 *     tags: [certificates]
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
import { certificateRepository } from "../../../../repositories/certificate.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { TimelineService } from "../../../../services/certificate/timeline.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Certificate Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const cert = await certificateRepository.findById(id, {
      populate: ["student", "course", "batch", "template"],
    });

    if (!cert) {
      return NextResponse.json(ResponseHelper.error("Certificate credential profile not found"), { status: 404 });
    }

    // Student Isolation Guard: Student can only view their own certificate
    if (userContext.role?.toLowerCase() === "student") {
      const certStudentId = (cert.student as any)?._id?.toString() || cert.student?.toString();
      const certStudentUserId = (cert.student as any)?.user?.toString();
      let isOwn = userContext.userId === certStudentId || userContext.userId === certStudentUserId;
      if (!isOwn) {
        const { Student } = await import("../../../../models/student.model");
        const studentDoc = await Student.findOne({ user: userContext.userId });
        if (studentDoc && studentDoc._id.toString() === certStudentId) {
          isOwn = true;
        }
      }
      if (!isOwn) {
        return NextResponse.json(
          ResponseHelper.error("Access forbidden: You cannot access another student's certificate"),
          { status: 403 }
        );
      }
    }

    return NextResponse.json(ResponseHelper.success("Certificate profile fetched", cert), { status: 200 });
  })
);

// PUT Update Certificate details - Hardened Against Unsafe Modifications of Issued Credentials
export const PUT = withRoles(
  ["Admin", "Super Admin", "Certificate Officer"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const existing = await certificateRepository.findById(id);
    if (!existing) {
      return NextResponse.json(ResponseHelper.error("Certificate not found"), { status: 404 });
    }

    // Protected Academic and Identity Fields (cannot be modified to tamper with academic performance or identity)
    const academicFields = [
      "student",
      "enrollment",
      "course",
      "batch",
      "cohort",
      "certificateNumber",
      "certificateUuid",
      "verificationCode",
      "completionDate",
      "grade",
      "percentage",
    ];

    const attemptedAcademicModifications = academicFields.filter(
      (field) => body[field] !== undefined && String(body[field]) !== String((existing as any)[field])
    );

    if (attemptedAcademicModifications.length > 0) {
      return NextResponse.json(
        ResponseHelper.error(
          `Cannot modify authoritative academic or identity fields: [${attemptedAcademicModifications.join(
            ", "
          )}]. These are derived authoritatively from enrollment and academic records.`
        ),
        { status: 422 }
      );
    }

    // 1. Protection for Issued / Revoked Certificates
    if (existing.status === "issued" || existing.status === "revoked") {
      const extraProtected = ["issueDate", "issuedBy", "approvedBy", "template"];
      const attemptedExtra = extraProtected.filter(
        (field) => body[field] !== undefined && String(body[field]) !== String((existing as any)[field])
      );

      if (attemptedExtra.length > 0) {
        return NextResponse.json(
          ResponseHelper.error(
            `Cannot modify protected fields on an already ${existing.status} certificate: [${attemptedExtra.join(
              ", "
            )}]. Modifications to issued certificates must use the formal Revise & Reissue workflow.`
          ),
          { status: 422 }
        );
      }

      // Prevent arbitrary status changes away from issued/revoked via generic PUT
      if (body.status && body.status !== existing.status) {
        return NextResponse.json(
          ResponseHelper.error(
            `Cannot change status of a ${existing.status} certificate via PUT. Use dedicated lifecycle endpoints (/revoke, /revise, etc.).`
          ),
          { status: 422 }
        );
      }
    }

    // Sanitize and prepare update payload
    const updatePayload: any = {};

    // Prevent bypassing the formal issue flow via status: "issued"
    if (body.status && existing.status === "draft" && body.status === "issued") {
      return NextResponse.json(
        ResponseHelper.error(
          "Cannot issue certificate via generic PUT. Please use the official POST /api/certificates/:id/issue endpoint to enforce governance and eligibility verification."
        ),
        { status: 422 }
      );
    }

    if (body.remarks !== undefined) updatePayload.remarks = body.remarks;
    if (body.template !== undefined && existing.status === "draft") updatePayload.template = body.template;

    // Sanitize and handle customization presentation fields
    const sanitizeText = (txt?: any): string | undefined => {
      if (typeof txt !== "string") return undefined;
      return txt.replace(/<[^>]*>?/gm, "").trim();
    };

    let isDraftEdited = false;
    if (body.customization && typeof body.customization === "object") {
      isDraftEdited = true;
      const prevCustom = (existing as any).customization || {};
      const newCustom: any = { ...prevCustom };

      const allowedPresentationKeys = [
        "title",
        "subtitle",
        "courseDisplayName",
        "achievementWording",
        "instructorDisplayName",
        "instructorTitle",
        "signatoryDisplayName",
        "signatoryTitle",
        "institutionName",
        "footerWording",
      ];

      for (const key of allowedPresentationKeys) {
        if (body.customization[key] !== undefined) {
          newCustom[key] = sanitizeText(body.customization[key]);
        }
      }

      updatePayload.customization = newCustom;
    }

    const updated = await certificateRepository.update(id, updatePayload);
    if (!updated) {
      return NextResponse.json(ResponseHelper.error("Certificate not found"), { status: 404 });
    }

    if (isDraftEdited && existing.status === "draft") {
      await TimelineService.logEvent(
        id,
        "draft-edited",
        "Certificate presentation and layout fields customized by administrator",
        userContext.userId
      );
    } else {
      await TimelineService.logEvent(
        id,
        "updated",
        "Certificate administrative metadata updated",
        userContext.userId
      );
    }

    return NextResponse.json(ResponseHelper.success("Certificate credential updated", updated), { status: 200 });
  })
);

// DELETE Soft-delete Certificate
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const deleted = await certificateRepository.softDelete(id);
    if (!deleted) {
      return NextResponse.json(ResponseHelper.error("Certificate not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Certificate credential archived", deleted), { status: 200 });
  })
);
