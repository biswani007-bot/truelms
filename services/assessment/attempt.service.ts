/* eslint-disable @typescript-eslint/no-explicit-any */
import { assessmentAttemptRepository } from "../../repositories/assessment-attempt.repository";
import { assessmentRepository } from "../../repositories/assessment.repository";
import { studentRepository } from "../../repositories/student.repository";
import { TimelineService } from "./timeline.service";
import { AssessmentAttempt } from "../../models/assessment-attempt.model";
import { AssessmentQuestion } from "../../models/assessment-question.model";
import { AssessmentResult } from "../../models/assessment-result.model";
import "../../models/question-bank.model";
import { GradeHelper } from "../../utils/grade-helper";

export class AttemptService {
  static async startAttempt(studentId: string, assessmentId: string) {
    const assessment = await assessmentRepository.findById(assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    if (assessment.status !== "running" && assessment.status !== "published") {
      throw new Error("Assessment window is not open");
    }

    // Resolve real Student ID if user ID was passed
    let resolvedStudentId = studentId;
    const studentDoc = await studentRepository.findOne({ user: studentId });
    if (studentDoc) {
      resolvedStudentId = studentDoc._id.toString();
    }

    const previousAttempts = await assessmentAttemptRepository.findMany({ student: resolvedStudentId, assessment: assessmentId });

    // 1. Resume active attempt if one already exists
    const activeAttempt = previousAttempts.find((a: any) => a.status === "in-progress");
    if (activeAttempt) {
      return activeAttempt;
    }

    // 2. Enforce attempt limit
    const attemptLimit = assessment.attemptLimit || 1;
    if (previousAttempts.length >= attemptLimit) {
      throw new Error("Exceeded maximum attempt limits");
    }

    // 3. Create new attempt
    const attempt = await AssessmentAttempt.create({
      student: resolvedStudentId as any,
      assessment: assessmentId as any,
      attemptNumber: previousAttempts.length + 1,
      startedAt: new Date(),
      status: "in-progress",
    });

    try {
      await TimelineService.logEvent(assessmentId, "started", `Student started attempt #${previousAttempts.length + 1}`, resolvedStudentId);
    } catch (timelineErr) {
      console.warn("Failed to log assessment start event to timeline:", timelineErr);
    }

    return attempt;
  }

  static async submitAttempt(attemptId: string, answers: any[], autoSubmitted = false) {
    const attempt = await assessmentAttemptRepository.findById(attemptId);
    if (!attempt) throw new Error("Attempt record not found");

    const assessment = await assessmentRepository.findById(attempt.assessment.toString());
    const submittedAt = new Date();
    const timeTaken = Math.round((submittedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000);

    // Compute automatic score for objective questions
    let totalObtained = 0;
    let totalMax = 0;

    const questions = await AssessmentQuestion.find({ assessment: attempt.assessment }).populate("questionBank").lean();

    if (questions && questions.length > 0) {
      for (const aq of questions) {
        const qb = aq.questionBank as any;
        if (!qb) continue;
        const qMarks = aq.marksOverride || qb.marks || 5;
        totalMax += qMarks;

        const studentAns = answers.find(
          (a) => String(a.questionId || a.question || a._id) === String(qb._id) ||
                 String(a.questionId || a.question || a._id) === String(aq._id)
        );

        if (studentAns && studentAns.answer !== undefined) {
          const userVal = String(studentAns.answer).trim().toLowerCase();
          const correctVal = String(qb.correctAnswer).trim().toLowerCase();

          if (userVal === correctVal) {
            totalObtained += qMarks;
          }
        }
      }
    } else {
      totalMax = assessment?.maximumMarks || 100;
    }

    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const passThreshold = assessment?.passingMarks || 40;
    const isPassing = percentage >= passThreshold;

    const updated = await AssessmentAttempt.findByIdAndUpdate(
      attemptId,
      {
        $set: {
          answers,
          submittedAt,
          timeTaken,
          autoSubmitted,
          status: autoSubmitted ? "auto-submitted" : "submitted",
          score: totalObtained,
          percentage,
        },
      },
      { new: true }
    );

    // Create / Update verified AssessmentResult
    await AssessmentResult.findOneAndUpdate(
      { attempt: attemptId },
      {
        student: attempt.student,
        assessment: attempt.assessment,
        attempt: attemptId as any,
        totalMarksObtained: totalObtained,
        percentage,
        grade: GradeHelper.getLetterGrade(percentage, passThreshold),
        status: isPassing ? "pass" : "fail",
      },
      { upsert: true, new: true }
    );

    try {
      await TimelineService.logEvent(
        attempt.assessment.toString(),
        "submitted",
        `Student submission completed (${autoSubmitted ? "Auto-Submitted" : "Manually Submitted"}) - Score: ${totalObtained}/${totalMax}`,
        attempt.student.toString()
      );
    } catch (timelineErr) {
      console.warn("Failed to log assessment submit event to timeline:", timelineErr);
    }

    return updated;
  }
}
