/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "@/middleware/auth.middleware";
import { ResponseHelper } from "@/helpers/response";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";
import { Enrollment } from "@/models/enrollment.model";
import { Certificate } from "@/models/certificate.model";
import { CertificateEligibility } from "@/models/certificate-eligibility.model";
import { EligibilityService } from "@/services/certificate/eligibility.service";
import { CertificateService } from "@/services/certificate/certificate.service";
import { CertificateEligibilityConfigService } from "@/services/certificate/certificate-config.service";

// GET List of students ready for certificate review & issuance
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"],
  apiHandler(async (_req: NextRequest) => {
    await connectDB();

    const rules = await CertificateEligibilityConfigService.getEligibilityRules();

    // Query completed enrollments or active enrollments
    const enrollments = await Enrollment.find({
      status: { $nin: ["cancelled", "refunded"] },
      isDeleted: { $ne: true },
    })
      .populate("student", "firstName lastName email avatar")
      .populate("course", "name courseName code")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const results = await Promise.all(
      enrollments.map(async (enr: any) => {
        // Calculate/fetch eligibility
        let eligibility: any = await CertificateEligibility.findOne({ enrollment: enr._id }).lean();
        if (!eligibility) {
          try {
            eligibility = await EligibilityService.calculateEligibility(enr._id.toString());
          } catch {
            eligibility = null;
          }
        }

        // Find existing certificate (draft or issued)
        const cert: any = await Certificate.findOne({
          enrollment: enr._id,
          status: { $ne: "revoked" },
          isDeleted: { $ne: true },
        })
          .select("_id certificateNumber status issueDate completionDate")
          .lean();

        return {
          enrollmentId: enr._id,
          student: enr.student,
          course: enr.course,
          enrollmentStatus: enr.status,
          completionDate: enr.completedAt || enr.updatedAt,
          eligibility: eligibility
            ? {
                attendancePercentage: eligibility.attendancePercentage,
                assignmentCompletionRate: eligibility.assignmentCompletionRate,
                assessmentPassStatus: eligibility.assessmentPassStatus,
                courseCompleted: eligibility.courseCompleted,
                isEligible: eligibility.isEligible,
              }
            : null,
          certificate: cert
            ? {
                id: cert._id,
                certificateNumber: cert.certificateNumber,
                status: cert.status,
              }
            : null,
        };
      })
    );

    return NextResponse.json(
      ResponseHelper.success("Eligible candidates retrieved successfully", {
        rules,
        candidates: results,
      }),
      { status: 200 }
    );
  })
);

// POST Generate draft certificate for an eligible enrollment
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const { enrollmentId } = body;
    if (!enrollmentId) {
      return NextResponse.json(ResponseHelper.error("Enrollment ID is required"), { status: 400 });
    }

    const result = await CertificateService.onCourseCompletion(enrollmentId, userContext.userId);
    if (!result.success || !result.certificate) {
      return NextResponse.json(
        ResponseHelper.error(result.message || "Enrollment is not eligible for certificate issuance"),
        { status: 422 }
      );
    }

    return NextResponse.json(
      ResponseHelper.success(result.message, result.certificate),
      { status: result.created ? 201 : 200 }
    );
  })
);
