import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IBatchTimeline extends IBaseDocument {
  batch: mongoose.Types.ObjectId;
  event:
    | "created"
    | "student-assigned"
    | "student-removed"
    | "student-transferred"
    | "student-swapped"
    | "teacher-assigned"
    | "teacher-updated"
    | "teacher-removed"
    | "waiting-list-added"
    | "waiting-list-promoted"
    | "waiting-list-cancelled"
    | "capacity-changed"
    | "status-changed"
    | "merged"
    | "split"
    | "rule-applied"
    | "recommendation-generated";
  description: string;
  performedBy?: mongoose.Types.ObjectId;
  referenceId?: mongoose.Types.ObjectId; // student/teacher/enrollment ObjectId
  referenceType?: "student" | "teacher" | "enrollment" | "batch";
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const BatchTimelineSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    event: {
      type: String,
      enum: [
        "created",
        "student-assigned",
        "student-removed",
        "student-transferred",
        "student-swapped",
        "teacher-assigned",
        "teacher-updated",
        "teacher-removed",
        "waiting-list-added",
        "waiting-list-promoted",
        "waiting-list-cancelled",
        "capacity-changed",
        "status-changed",
        "merged",
        "split",
        "rule-applied",
        "recommendation-generated",
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    referenceId: { type: Schema.Types.ObjectId, index: true },
    referenceType: {
      type: String,
      enum: ["student", "teacher", "enrollment", "batch"],
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

BatchTimelineSchema.plugin(baseModelPlugin);

export const BatchTimeline =
  mongoose.models.BatchTimeline || mongoose.model<IBatchTimeline>("BatchTimeline", BatchTimelineSchema);
