/* eslint-disable @typescript-eslint/no-explicit-any */
import { assessmentEvaluationRepository } from "../../repositories/assessment-evaluation.repository";
import { assessmentAttemptRepository } from "../../repositories/assessment-attempt.repository";
import { assessmentRepository } from "../../repositories/assessment.repository";
import { TimelineService } from "./timeline.service";
import { AssessmentResult } from "../../models/assessment-result.model";
import { AssessmentEvaluation } from "../../models/assessment-evaluation.model";

export class ResultService {
  static async publishResults(assessmentId: string, evaluatorId: string) {
    const attempts = await assessmentAttemptRepository.findMany({ assessment: assessmentId });
    const attemptIds = attempts.map((a) => a._id.toString());

    // Find all evaluations
    const evaluations = await assessmentEvaluationRepository.findMany({ attempt: { $in: attemptIds } });
    const evalMap = new Map(evaluations.map((e) => [e.attempt.toString(), e]));

    const assessment = await assessmentRepository.findById(assessmentId);
    if (!assessment) throw new Error("Assessment profile not found");

    const createdResults = [];

    for (const attempt of attempts) {
      const evalObj = evalMap.get(attempt._id.toString());
      if (!evalObj) continue;

      // Determine pass/fail status
      const pass = evalObj.marksObtained >= assessment.passingMarks;

      const result = await AssessmentResult.findOneAndUpdate(
        { attempt: attempt._id as any },
        {
          $set: {
            student: attempt.student,
            assessment: assessment._id,
            totalMarksObtained: evalObj.marksObtained,
            percentage: evalObj.percentage,
            grade: evalObj.grade,
            status: pass ? "pass" : "fail",
          },
        },
        { upsert: true, new: true }
      );

      createdResults.push(result);
    }

    // Publish evaluations
    await AssessmentEvaluation.updateMany(
      { attempt: { $in: attemptIds } },
      { $set: { published: true } }
    );

    await TimelineService.logEvent(
      assessmentId,
      "result-published",
      "Assessment scorecard results published to dashboards",
      evaluatorId
    );

    return { published: createdResults.length };
  }
}
