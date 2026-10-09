/* eslint-disable @typescript-eslint/no-explicit-any */
import { assessmentAttemptRepository } from "../../repositories/assessment-attempt.repository";
import { assessmentRepository } from "../../repositories/assessment.repository";
import { assessmentQuestionRepository } from "../../repositories/assessment-question.repository";
import { questionBankRepository } from "../../repositories/question-bank.repository";
import { GradeScaleService } from "./grade-scale.service";
import { TimelineService } from "./timeline.service";
import { AssessmentEvaluation } from "../../models/assessment-evaluation.model";
import { AssessmentAttempt } from "../../models/assessment-attempt.model";

export class EvaluationService {
  static async evaluateAttempt(attemptId: string, manualScores: Array<{ questionId: string; marks: number }>, evaluatorId: string) {
    const attempt = await assessmentAttemptRepository.findById(attemptId);
    if (!attempt) throw new Error("Attempt not found");

    const assessment = await assessmentRepository.findById(attempt.assessment.toString());
    if (!assessment) throw new Error("Assessment not found");

    // Load linked questions
    const linkedQs = await assessmentQuestionRepository.findMany({ assessment: assessment._id.toString() });
    const qIds = linkedQs.map((l) => l.questionBank.toString());
    const questions = await questionBankRepository.findMany({ _id: { $in: qIds } });
    const qMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let marksObtained = 0;

    for (const ans of attempt.answers) {
      const qObj = qMap.get(ans.questionId.toString());
      if (!qObj) continue;

      // Auto-scoring logic for MCQ & True/False
      if (qObj.type === "MCQ" || qObj.type === "true-false") {
        if (String(ans.answerValue).trim().toLowerCase() === String(qObj.correctAnswer).trim().toLowerCase()) {
          marksObtained += qObj.marks;
        } else if (assessment.negativeMarking) {
          marksObtained -= Math.round(qObj.marks * 0.25); // 25% negative penalty
        }
      } else {
        // Manual override lookup
        const manual = manualScores.find((m) => m.questionId === ans.questionId.toString());
        if (manual) {
          marksObtained += manual.marks;
        }
      }
    }

    marksObtained = Math.max(0, marksObtained);
    const percentage = Math.round((marksObtained / assessment.maximumMarks) * 100);
    const grade = await GradeScaleService.getGrade(percentage);

    const evaluation = await AssessmentEvaluation.findOneAndUpdate(
      { attempt: attemptId as any },
      {
        $set: {
          marksObtained,
          percentage,
          grade,
          evaluatedBy: evaluatorId as any,
          evaluatedAt: new Date(),
          published: false,
        },
      },
      { upsert: true, new: true }
    );

    await AssessmentAttempt.findByIdAndUpdate(attemptId, { status: "evaluated" });

    await TimelineService.logEvent(
      assessment._id.toString(),
      "evaluated",
      `Student attempt evaluated: ${marksObtained}/${assessment.maximumMarks}`,
      evaluatorId
    );

    return evaluation;
  }
}
