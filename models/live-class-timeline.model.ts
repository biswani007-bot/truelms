import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILiveClassTimeline extends IBaseDocument {
  liveClass: mongoose.Types.ObjectId;
  event:
    | "created"
    | "scheduled"
    | "rescheduled"
    | "teacher-changed"
    | "resources-added"
    | "recording-published"
    | "completed"
    | "cancelled";
  description: string;
  performedBy?: mongoose.Types.ObjectId;
  timestamp: Date;
}

const LiveClassTimelineSchema = new Schema(
  {
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass", required: true, index: true },
    event: {
      type: String,
      enum: [
        "created",
        "scheduled",
        "rescheduled",
        "teacher-changed",
        "resources-added",
        "recording-published",
        "completed",
        "cancelled",
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

LiveClassTimelineSchema.plugin(baseModelPlugin);

export const LiveClassTimeline =
  mongoose.models.LiveClassTimeline ||
  mongoose.model<ILiveClassTimeline>("LiveClassTimeline", LiveClassTimelineSchema);
