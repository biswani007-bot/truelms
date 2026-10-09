import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssessmentAttempt extends IBaseDocument {
  student: mongoose.Types.ObjectId;
  assessment: mongoose.Types.ObjectId;
  attemptNumber: number;
  startedAt: Date;
  submittedAt?: Date;
  timeTaken?: number; // in seconds
  autoSubmitted: boolean;
  status: "not-started" | "in-progress" | "submitted" | "auto-submitted" | "evaluated";
  answers: Array<{
    questionId: mongoose.Types.ObjectId;
    answerValue: unknown; // MCQ string, long essay text, coding string
  }>;
  browserInfo?: string;
  ipAddress?: string;
}

const AssessmentAttemptSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    assessment: { type: Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    attemptNumber: { type: Number, required: true, default: 1 },
    startedAt: { type: Date, required: true, default: Date.now, index: true },
    submittedAt: { type: Date, index: true },
    timeTaken: { type: Number },
    autoSubmitted: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "submitted", "auto-submitted", "evaluated"],
      required: true,
      default: "in-progress",
      index: true,
    },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "QuestionBank", required: true },
        answerValue: { type: Schema.Types.Mixed },
      },
    ],
    browserInfo: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

AssessmentAttemptSchema.plugin(baseModelPlugin);

export const AssessmentAttempt =
  mongoose.models.AssessmentAttempt ||
  mongoose.model<IAssessmentAttempt>("AssessmentAttempt", AssessmentAttemptSchema);
