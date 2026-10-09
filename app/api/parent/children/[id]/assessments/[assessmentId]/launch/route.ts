/**
 * @swagger
 * /api/parent/children/{id}/assessments/{assessmentId}/launch:
 *   post:
 *     summary: Auto-generated summary for POST /api/parent/children/{id}/assessments/{assessmentId}/launch
 *     tags: [parent]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";
import { BatchStudent } from "@/models/batch-student.model";
import { Assessment } from "@/models/assessment.model";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { cookies } from "next/headers";

export const POST = apiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string; assessmentId: string }> }) => {
    const { id, assessmentId } = await params;
    const { parent } = await getAuthenticatedParent(req);

    // 1. Verify parent owns/is authorized for the child
    const { student } = await ParentService.authorizeChildAccess(parent._id, id);
    const studentId = student._id;

    // 2. Verify assessment exists and is published
    const assessment = await Assessment.findOne({ _id: assessmentId, status: "published", isDeleted: { $ne: true } });
    if (!assessment) {
      return NextResponse.json(ApiResponse.error("Assessment not found or not published"), { status: 404 });
    }

    // 3. Verify student is eligible (enrolled in the batch of the assessment)
    const isEligible = await BatchStudent.exists({
      student: studentId,
      batch: assessment.batch,
      status: "active",
      isDeleted: { $ne: true },
    });

    if (!isEligible) {
      return NextResponse.json(ApiResponse.error("Student is not eligible for this assessment"), { status: 403 });
    }

    // 4. Create temporary assessment-scoped proxy token
    const tokenPayload = {
      parentId: parent._id.toString(),
      studentId: studentId.toString(),
      assessmentId: assessmentId.toString(),
      tokenType: "assessment_proxy",
      purpose: "student_assessment_runner",
    };

    // Expiry: duration + 15 mins grace period (max 4 hours for safety)
    const durationMins = assessment.duration || 60;
    const expirySeconds = Math.min((durationMins + 15) * 60, 4 * 60 * 60);

    const token = jwt.sign(tokenPayload, env.JWT_SECRET + "_assessment_proxy", {
      expiresIn: expirySeconds,
      audience: "truelern-student-runner",
      issuer: "truelern-parent-proxy",
    });

    // 5. Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("assessment_proxy_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expirySeconds,
      path: "/api/assessments", // Scoped specifically to the runner API routes
    });

    return NextResponse.json(
      ApiResponse.success("Assessment proxy session created", {
        redirectUrl: `/student/assessments/${assessmentId}`,
      })
    );
  }
);
