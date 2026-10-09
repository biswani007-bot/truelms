import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssessmentQuestion extends IBaseDocument {
  assessment: mongoose.Types.ObjectId;
  questionBank: mongoose.Types.ObjectId;
  marksOverride?: number;
  displayOrder: number;
}

const AssessmentQuestionSchema = new Schema(
  {
    assessment: { type: Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    questionBank: { type: Schema.Types.ObjectId, ref: "QuestionBank", required: true, index: true },
    marksOverride: { type: Number },
    displayOrder: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

AssessmentQuestionSchema.plugin(baseModelPlugin);

export const AssessmentQuestion =
  mongoose.models.AssessmentQuestion ||
  mongoose.model<IAssessmentQuestion>("AssessmentQuestion", AssessmentQuestionSchema);
