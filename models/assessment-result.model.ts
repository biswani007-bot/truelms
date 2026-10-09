import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssessmentResult extends IBaseDocument {
  student: mongoose.Types.ObjectId;
  assessment: mongoose.Types.ObjectId;
  attempt: mongoose.Types.ObjectId;
  totalMarksObtained: number;
  percentage: number;
  grade?: string;
  status: "pass" | "fail" | "absent" | "incomplete";
}

const AssessmentResultSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    assessment: { type: Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    attempt: { type: Schema.Types.ObjectId, ref: "AssessmentAttempt", required: true, index: true },
    totalMarksObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String },
    status: { type: String, enum: ["pass", "fail", "absent", "incomplete"], required: true, default: "incomplete", index: true },
  },
  { timestamps: true }
);

AssessmentResultSchema.plugin(baseModelPlugin);

export const AssessmentResult =
  mongoose.models.AssessmentResult ||
  mongoose.model<IAssessmentResult>("AssessmentResult", AssessmentResultSchema);
