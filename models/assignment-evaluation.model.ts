import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssignmentEvaluation extends IBaseDocument {
  submission: mongoose.Types.ObjectId;
  marksObtained: number;
  percentage: number;
  grade?: string;
  feedback?: string;
  rubricScores?: Array<{
    criterion: string;
    maxMarks: number;
    awardedMarks: number;
    comments?: string;
  }>;
  evaluatedBy: mongoose.Types.ObjectId; // References User
  evaluatedAt: Date;
  published: boolean;
}

const AssignmentEvaluationSchema = new Schema(
  {
    submission: { type: Schema.Types.ObjectId, ref: "AssignmentSubmission", required: true, unique: true, index: true },
    marksObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String },
    feedback: { type: String },
    rubricScores: [
      {
        criterion: { type: String, required: true },
        maxMarks: { type: Number, required: true },
        awardedMarks: { type: Number, required: true },
        comments: { type: String },
      },
    ],
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    evaluatedAt: { type: Date, required: true, default: Date.now, index: true },
    published: { type: Boolean, required: true, default: false, index: true },
  },
  { timestamps: true }
);

AssignmentEvaluationSchema.plugin(baseModelPlugin);

export const AssignmentEvaluation =
  mongoose.models.AssignmentEvaluation ||
  mongoose.model<IAssignmentEvaluation>("AssignmentEvaluation", AssignmentEvaluationSchema);
