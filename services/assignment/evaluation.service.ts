/* eslint-disable @typescript-eslint/no-explicit-any */
import { assignmentSubmissionRepository } from "../../repositories/assignment-submission.repository";
import { assignmentRepository } from "../../repositories/assignment.repository";
import { TimelineService } from "./timeline.service";
import { AssignmentEvaluation } from "../../models/assignment-evaluation.model";
import { AssignmentSubmission } from "../../models/assignment-submission.model";
import { GradeHelper } from "../../utils/grade-helper";

export class EvaluationService {
  static async evaluate(
    submissionId: string,
    data: {
      marksObtained: number;
      feedback?: string;
      rubricScores?: Array<{ criterion: string; maxMarks: number; awardedMarks: number; comments?: string }>;
    },
    evaluatorId: string
  ) {
    const submission = await assignmentSubmissionRepository.findById(submissionId);
    if (!submission) throw new Error("Submission not found");

    const assignment = await assignmentRepository.findById(submission.assignment.toString());
    if (!assignment) throw new Error("Assignment profile not found");

    const finalMarks = data.marksObtained;
    const percentage = Math.round((finalMarks / assignment.totalMarks) * 100);
    const grade = GradeHelper.getLetterGrade(percentage);

    const evaluation = await AssignmentEvaluation.findOneAndUpdate(
      { submission: submissionId as any },
      {
        $set: {
          marksObtained: finalMarks,
          percentage,
          grade,
          feedback: data.feedback,
          rubricScores: data.rubricScores,
          evaluatedBy: evaluatorId as any,
          evaluatedAt: new Date(),
          published: false, // published later
        },
      },
      { upsert: true, new: true }
    );

    // Update submission status
    await AssignmentSubmission.findByIdAndUpdate(submissionId, { status: "accepted" });

    await TimelineService.logEvent(
      assignment._id.toString(),
      "evaluated",
      `Submission #${submission.submissionNumber} graded with ${finalMarks}/${assignment.totalMarks}`,
      evaluatorId
    );

    return evaluation;
  }

  static async publishGrades(assignmentId: string, evaluatorId: string) {
    const submissions = await assignmentSubmissionRepository.findMany({ assignment: assignmentId });
    const submissionIds = submissions.map((s) => s._id.toString());

    await AssignmentEvaluation.updateMany(
      { submission: { $in: submissionIds } },
      { $set: { published: true } }
    );

    await TimelineService.logEvent(
      assignmentId,
      "grade-published",
      "Evaluated grades published to student dashboards",
      evaluatorId
    );

    return { published: submissionIds.length };
  }
}
