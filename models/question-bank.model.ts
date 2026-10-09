import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IQuestionBank extends IBaseDocument {
  questionCode: string;
  questionText: string;
  category: string;
  difficultyLevel: "easy" | "medium" | "hard";
  marks: number;
  type:
    | "MCQ"
    | "multiple-select"
    | "true-false"
    | "short-answer"
    | "long-answer"
    | "essay"
    | "coding"
    | "file-upload"
    | "matching"
    | "fill-in-the-blanks";
  tags: string[];
  explanation?: string;
  options: string[]; // for MCQs and Select-All-That-Apply
  correctAnswer: string | string[];
  mediaAttachments: string[];
}

const QuestionBankSchema = new Schema(
  {
    questionCode: { type: String, required: true, unique: true, index: true },
    questionText: { type: String, required: true },
    category: { type: String, required: true, index: true },
    difficultyLevel: { type: String, enum: ["easy", "medium", "hard"], required: true, default: "medium", index: true },
    marks: { type: Number, required: true, default: 5 },
    type: {
      type: String,
      enum: [
        "MCQ",
        "multiple-select",
        "true-false",
        "short-answer",
        "long-answer",
        "essay",
        "coding",
        "file-upload",
        "matching",
        "fill-in-the-blanks",
      ],
      required: true,
      index: true,
    },
    tags: [{ type: String, index: true }],
    explanation: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    mediaAttachments: [{ type: String }],
  },
  { timestamps: true }
);

QuestionBankSchema.plugin(baseModelPlugin);

export const QuestionBank =
  mongoose.models.QuestionBank || mongoose.model<IQuestionBank>("QuestionBank", QuestionBankSchema);
