
/**
 * @swagger
 * /api/certificates:
 *   post:
 *     summary: Auto-generated summary for POST /api/certificates
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
 * /api/certificates:
 *   get:
 *     summary: Auto-generated summary for GET /api/certificates
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
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../middleware/auth.middleware";
import { certificateRepository } from "../../../repositories/certificate.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";
import { Enrollment } from "../../../models/enrollment.model";
import { CertificateEligibility } from "../../../models/certificate-eligibility.model";
import { CertificateApproval } from "../../../models/certificate-approval.model";
import { Certificate } from "../../../models/certificate.model";
import { CertificateTemplate } from "../../../models/certificate-template.model";
import { BatchStudent } from "../../../models/batch-student.model";
import { EligibilityService } from "../../../services/certificate/eligibility.service";
import { CertificateService } from "../../../services/certificate/certificate.service";
import { TimelineService } from "../../../services/certificate/timeline.service";
import { QRService } from "../../../services/certificate/qr.service";
import crypto from "crypto";

// GET Paginated Certificates
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer", "Teacher", "Student"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const url = new URL(req.url);
    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    });

    const status = url.searchParams.get("status");
    const course = url.searchParams.get("course");
    const batch = url.searchParams.get("batch");

    if (status) paginationInput.filters.status = status;
    if (course) paginationInput.filters.course = course;
    if (batch) paginationInput.filters.batch = batch;

    const searchableFields = ["certificateNumber", "verificationCode", "certificateUuid"];
    const result = await certificateRepository.paginate(paginationInput, searchableFields, {
      populate: ["student", "course", "batch"],
    });

    return NextResponse.json(
      ResponseHelper.success("Certificates fetched successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Certificate Profile - Hardened Against Eligibility Bypass
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    // 1. Resolve student and course / enrollment
    let enrollment: any = null;
    if (body.enrollment) {
      enrollment = await Enrollment.findById(body.enrollment);
    } else if (body.student && body.course) {
      // Find active student enrollment for this course
      enrollment = await Enrollment.findOne({
        student: body.student,
        course: body.course,
        isDeleted: { $ne: true },
        status: { $nin: ["cancelled", "refunded"] },
      });
    }

    if (!enrollment) {
      return NextResponse.json(
        ResponseHelper.error("Cannot create certificate: Valid active student enrollment not found for this course"),
        { status: 400 }
      );
    }

    // 2. Authoritative check: Calculate eligibility under current configured rules
    const el = await EligibilityService.calculateEligibility(enrollment._id.toString());

    const requestedStatus = body.status || "draft";

    // 3. CRITICAL INTEGRITY ENFORCEMENT: NO INELIGIBLE CERTIFICATE MAY BECOME ISSUED THROUGH CRUD
    if (requestedStatus === "issued") {
      if (!el || !el.isEligible) {
        return NextResponse.json(
          ResponseHelper.error(
            "Academic integrity violation: Cannot issue certificate for an ineligible student. Student has not satisfied current certificate eligibility criteria."
          ),
          { status: 422 }
        );
      }
    }

    // 4. Duplicate Check
    const existingCert = await Certificate.findOne({ enrollment: enrollment._id, isDeleted: { $ne: true } });
    if (existingCert && existingCert.status === "issued") {
      return NextResponse.json(
        ResponseHelper.error("A certificate has already been issued for this student enrollment"),
        { status: 409 }
      );
    }

    // 5. Ensure critical identity fields are properly generated
    const certificateNumber = body.certificateNumber || (await CertificateService.generateUniqueCertificateNumber());
    const certificateUuid = body.certificateUuid || crypto.randomUUID();
    const verificationCode = body.verificationCode || crypto.randomBytes(4).toString("hex").toUpperCase();
    const qrCodeMetadata = QRService.generateVerificationQRMetadata(certificateNumber, verificationCode);

    // Resolve batch from BatchStudent if available
    const batchStudent = await BatchStudent.findOne({ enrollment: enrollment._id, isDeleted: { $ne: true } });
    const batchId = body.batch || (batchStudent ? batchStudent.batch : enrollment.course);

    // Resolve template
    let templateId = body.template;
    if (!templateId) {
      const defaultTemplate = await CertificateTemplate.findOne({});
      if (defaultTemplate) {
        templateId = defaultTemplate._id;
      }
    }

    const certPayload: any = {
      ...body,
      student: enrollment.student,
      course: enrollment.course,
      enrollment: enrollment._id,
      batch: batchId,
      template: templateId,
      cohort: body.cohort || batchId,
      certificateNumber,
      certificateUuid,
      verificationCode,
      qrCodeMetadata,
      status: requestedStatus === "issued" ? "issued" : "draft",
      issueDate: requestedStatus === "issued" ? (body.issueDate || new Date()) : undefined,
      issuedBy: requestedStatus === "issued" ? userContext.userId : undefined,
      grade: body.grade || el?.overallGrade || "Pass",
      percentage: body.percentage || el?.attendancePercentage || 100,
      completionDate: body.completionDate || new Date(),
    };

    const cert = await certificateRepository.create(certPayload);

    if (cert.status === "draft") {
      await CertificateApproval.create({
        certificate: cert._id,
        status: "pending",
        requestedBy: userContext.userId,
      });
      await TimelineService.logEvent(
        cert._id.toString(),
        "generated",
        "Administrative certificate draft created, pending governance approval",
        userContext.userId
      );
    } else {
      await TimelineService.logEvent(
        cert._id.toString(),
        "issued",
        "Certificate administratively issued after eligibility verification",
        userContext.userId
      );
    }

    return NextResponse.json(ResponseHelper.success("Certificate created successfully", cert), { status: 201 });
  })
);
