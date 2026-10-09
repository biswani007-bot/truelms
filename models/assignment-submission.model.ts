import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssignmentSubmission extends IBaseDocument {
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  submissionNumber: string;
  submittedAt: Date;
  attemptNumber: number;
  files: string[];
  links: string[];
  comments?: string;
  wordCount?: number;
  lateSubmission: boolean;
  status: "not-started" | "draft" | "submitted" | "late" | "resubmitted" | "accepted" | "rejected";
  similarityPercentage?: number;
  plagiarismReportUrl?: string;
  plagiarismProvider?: string;
  plagiarismStatus?: "pending" | "completed" | "failed";
}

const AssignmentSubmissionSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    submissionNumber: { type: String, required: true, unique: true, index: true },
    submittedAt: { type: Date, required: true, default: Date.now, index: true },
    attemptNumber: { type: Number, required: true, default: 1 },
    files: [{ type: String }],
    links: [{ type: String }],
    comments: { type: String },
    wordCount: { type: Number },
    lateSubmission: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: ["not-started", "draft", "submitted", "late", "resubmitted", "accepted", "rejected"],
      required: true,
      default: "submitted",
      index: true,
    },
    similarityPercentage: { type: Number },
    plagiarismReportUrl: { type: String },
    plagiarismProvider: { type: String },
    plagiarismStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.plugin(baseModelPlugin);

export const AssignmentSubmission =
  mongoose.models.AssignmentSubmission ||
  mongoose.model<IAssignmentSubmission>("AssignmentSubmission", AssignmentSubmissionSchema);
