import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssessmentTimeline extends IBaseDocument {
  assessment: mongoose.Types.ObjectId;
  event: "created" | "published" | "started" | "submitted" | "evaluated" | "result-published" | "archived";
  description: string;
  performedBy?: mongoose.Types.ObjectId; // References User
  timestamp: Date;
}

const AssessmentTimelineSchema = new Schema(
  {
    assessment: { type: Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    event: {
      type: String,
      enum: ["created", "published", "started", "submitted", "evaluated", "result-published", "archived"],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

AssessmentTimelineSchema.plugin(baseModelPlugin);

export const AssessmentTimeline =
  mongoose.models.AssessmentTimeline ||
  mongoose.model<IAssessmentTimeline>("AssessmentTimeline", AssessmentTimelineSchema);
