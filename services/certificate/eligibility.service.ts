/* eslint-disable @typescript-eslint/no-explicit-any */
import { attendanceRepository } from "../../repositories/attendance.repository";
import { assignmentSubmissionRepository } from "../../repositories/assignment-submission.repository";
import { assessmentAttemptRepository } from "../../repositories/assessment-attempt.repository";
import { assessmentEvaluationRepository } from "../../repositories/assessment-evaluation.repository";
import { enrollmentRepository } from "../../repositories/enrollment.repository";
import { CertificateEligibility } from "../../models/certificate-eligibility.model";
import { CertificateEligibilityConfigService } from "./certificate-config.service";

export class EligibilityService {
  /**
   * Authoritatively evaluates student certificate eligibility using
   * the backend-configured eligibility rules.
   */
  static async calculateEligibility(enrollmentId: string) {
    const enrollment = await enrollmentRepository.findById(enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");

    // Authoritative Single Source of Truth: Load configured certificate rules
    const rules = await CertificateEligibilityConfigService.getEligibilityRules();
    const studentId = enrollment.student;

    // 1. Calculate Attendance Percentage
    const attendances = await attendanceRepository.findMany({ student: studentId });
    const presentCount = attendances.filter((a) => a.status === "present" || a.status === "late").length;
    const attendancePercentage = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : 100;
    const isAttendanceMet = attendancePercentage >= rules.attendanceThreshold;

    // 2. Calculate Assignment Completion Rate
    const submissions = await assignmentSubmissionRepository.findMany({ student: studentId });
    const submittedCount = submissions.filter((s) => s.status === "submitted" || s.status === "accepted" || s.status === "late").length;
    const assignmentCompletionRate = submissions.length > 0 ? Math.round((submittedCount / submissions.length) * 100) : 100;
    const isAssignmentMet = assignmentCompletionRate >= rules.assignmentSubmissionThreshold;

    // 3. Calculate Assessment / Quiz Pass Status
    const attempts = await assessmentAttemptRepository.findMany({ student: studentId });
    const attemptIds = attempts.map((a) => a._id.toString());
    const evaluations = await assessmentEvaluationRepository.findMany({ attempt: { $in: attemptIds } });
    const assessmentPassStatus = evaluations.length > 0
      ? evaluations.every((e) => e.percentage >= rules.quizPassingThreshold)
      : true;

    // 4. Syllabus Completion Requirement
    const courseCompleted = rules.syllabusCompletionRequired
      ? enrollment.status === "completed"
      : true;

    // Determine authoritative final eligibility
    const isEligible = isAttendanceMet && isAssignmentMet && assessmentPassStatus && courseCompleted;

    const el = await CertificateEligibility.findOneAndUpdate(
      { enrollment: enrollmentId as any },
      {
        $set: {
          student: enrollment.student,
          course: enrollment.course,
          attendancePercentage,
          assignmentCompletionRate,
          assessmentPassStatus,
          overallGrade: "Pass",
          courseCompleted,
          isEligible,
          calculatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return el;
  }
}
