import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { verifyAuth } from "@/middleware/auth.middleware";
import { BatchStudent } from "@/models/batch-student.model";
import { Assessment } from "@/models/assessment.model";

export async function verifyAssessmentAccess(req: NextRequest, assessmentId: string) {
  // 1. Check for normal session first
  const normalUser = verifyAuth(req);
  if (normalUser && normalUser.role?.toLowerCase() === "student") {
    // Check if normal student is eligible
    const { Student } = await import("@/models/student.model");
    const student = await Student.findOne({ user: normalUser.userId });
    if (student) {
      const assessment = await Assessment.findById(assessmentId);
      if (assessment) {
        const isEligible = await BatchStudent.exists({
          student: student._id,
          batch: assessment.batch,
          status: "active",
          isDeleted: { $ne: true }
        });
        if (isEligible) {
          return { studentId: student._id.toString(), type: "normal" };
        }
      }
    }
  }

  // 2. Fallback to Proxy Token
  const proxyToken = req.cookies.get("assessment_proxy_token")?.value;
  if (!proxyToken) return null;

  try {
    const decoded = jwt.verify(proxyToken, env.JWT_SECRET + "_assessment_proxy", {
      audience: "truelern-student-runner",
      issuer: "truelern-parent-proxy",
    }) as any;

    if (decoded.tokenType === "assessment_proxy" && decoded.assessmentId === assessmentId) {
      // Re-verify eligibility to ensure safe submission
      const assessment = await Assessment.findById(assessmentId);
      if (assessment && assessment.status === "published" && assessment.isDeleted !== true) {
        const isEligible = await BatchStudent.exists({
          student: decoded.studentId,
          batch: assessment.batch,
          status: "active",
          isDeleted: { $ne: true }
        });
        if (isEligible) {
          return { studentId: decoded.studentId, type: "proxy", parentId: decoded.parentId };
        }
      }
    }
  } catch (err) {
    console.error("Invalid proxy token", err);
  }

  return null;
}
