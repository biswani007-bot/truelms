/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { CertificateEligibilityConfigService } from "../../../../../services/certificate/certificate-config.service";

/**
 * GET /api/admin/certificates/settings
 * Retrieves the authoritative certificate eligibility rules and recommended defaults.
 */
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"],
  apiHandler(async () => {
    await connectDB();
    const rules = await CertificateEligibilityConfigService.getEligibilityRules();
    const recommendedDefaults = CertificateEligibilityConfigService.getDefaultRules();

    return NextResponse.json(
      ResponseHelper.success("Certificate eligibility settings retrieved successfully", rules, {
        recommendedDefaults,
      }),
      { status: 200 }
    );
  })
);

/**
 * PUT /api/admin/certificates/settings
 * Updates certificate eligibility rules with strict validation or resets to recommended defaults.
 */
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        ResponseHelper.error("Invalid request payload. Expected an object with certificate rule thresholds."),
        { status: 400 }
      );
    }

    // Reset to defaults shortcut
    if (body.reset === true) {
      const resetRules = await CertificateEligibilityConfigService.resetToDefaults(userContext.userId);
      return NextResponse.json(
        ResponseHelper.success("Certificate eligibility rules reset to recommended defaults", resetRules),
        { status: 200 }
      );
    }

    // Strict validation
    if (body.attendanceThreshold !== undefined) {
      const num = Number(body.attendanceThreshold);
      if (isNaN(num) || !Number.isFinite(num) || num < 0 || num > 100) {
        return NextResponse.json(
          ResponseHelper.error("Validation failed: Attendance threshold must be a number between 0 and 100."),
          { status: 422 }
        );
      }
    }

    if (body.assignmentSubmissionThreshold !== undefined) {
      const num = Number(body.assignmentSubmissionThreshold);
      if (isNaN(num) || !Number.isFinite(num) || num < 0 || num > 100) {
        return NextResponse.json(
          ResponseHelper.error("Validation failed: Assignment submission threshold must be a number between 0 and 100."),
          { status: 422 }
        );
      }
    }

    if (body.quizPassingThreshold !== undefined) {
      const num = Number(body.quizPassingThreshold);
      if (isNaN(num) || !Number.isFinite(num) || num < 0 || num > 100) {
        return NextResponse.json(
          ResponseHelper.error("Validation failed: Quiz / assessment passing threshold must be a number between 0 and 100."),
          { status: 422 }
        );
      }
    }

    if (body.syllabusCompletionRequired !== undefined && typeof body.syllabusCompletionRequired !== "boolean") {
      return NextResponse.json(
        ResponseHelper.error("Validation failed: Syllabus completion requirement must be a boolean (true or false)."),
        { status: 422 }
      );
    }

    try {
      const updatedRules = await CertificateEligibilityConfigService.updateEligibilityRules(
        {
          attendanceThreshold: body.attendanceThreshold,
          assignmentSubmissionThreshold: body.assignmentSubmissionThreshold,
          quizPassingThreshold: body.quizPassingThreshold,
          syllabusCompletionRequired: body.syllabusCompletionRequired,
        },
        userContext.userId
      );

      return NextResponse.json(
        ResponseHelper.success("Certificate eligibility rules updated successfully", updatedRules),
        { status: 200 }
      );
    } catch (err: any) {
      return NextResponse.json(
        ResponseHelper.error(err.message || "Failed to update certificate eligibility rules"),
        { status: 400 }
      );
    }
  })
);
