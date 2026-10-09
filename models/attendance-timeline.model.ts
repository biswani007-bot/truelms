import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAttendanceTimeline extends IBaseDocument {
  liveClass: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  event:
    | "session-opened"
    | "attendance-marked"
    | "attendance-edited"
    | "session-closed"
    | "freeze"
    | "re-open"
    | "rule-applied";
  description: string;
  performedBy?: mongoose.Types.ObjectId; // References User
  timestamp: Date;
}

const AttendanceTimelineSchema = new Schema(
  {
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass", required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    event: {
      type: String,
      enum: [
        "session-opened",
        "attendance-marked",
        "attendance-edited",
        "session-closed",
        "freeze",
        "re-open",
        "rule-applied",
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

AttendanceTimelineSchema.plugin(baseModelPlugin);

export const AttendanceTimeline =
  mongoose.models.AttendanceTimeline ||
  mongoose.model<IAttendanceTimeline>("AttendanceTimeline", AttendanceTimelineSchema);
