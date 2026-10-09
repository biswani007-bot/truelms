import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssessmentEvaluation extends IBaseDocument {
  attempt: mongoose.Types.ObjectId;
  marksObtained: number;
  percentage: number;
  grade?: string;
  remarks?: string;
  evaluatedBy: mongoose.Types.ObjectId; // References User
  evaluatedAt: Date;
  published: boolean;
}

const AssessmentEvaluationSchema = new Schema(
  {
    attempt: { type: Schema.Types.ObjectId, ref: "AssessmentAttempt", required: true, unique: true, index: true },
    marksObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String },
    remarks: { type: String },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    evaluatedAt: { type: Date, required: true, default: Date.now, index: true },
    published: { type: Boolean, required: true, default: false, index: true },
  },
  { timestamps: true }
);

AssessmentEvaluationSchema.plugin(baseModelPlugin);

export const AssessmentEvaluation =
  mongoose.models.AssessmentEvaluation ||
  mongoose.model<IAssessmentEvaluation>("AssessmentEvaluation", AssessmentEvaluationSchema);
