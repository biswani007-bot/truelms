import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssignmentTimeline extends IBaseDocument {
  assignment: mongoose.Types.ObjectId;
  event:
    | "created"
    | "published"
    | "updated"
    | "submitted"
    | "resubmitted"
    | "evaluated"
    | "grade-published"
    | "archived";
  description: string;
  performedBy?: mongoose.Types.ObjectId; // References User
  timestamp: Date;
}

const AssignmentTimelineSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    event: {
      type: String,
      enum: [
        "created",
        "published",
        "updated",
        "submitted",
        "resubmitted",
        "evaluated",
        "grade-published",
        "archived",
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

AssignmentTimelineSchema.plugin(baseModelPlugin);

export const AssignmentTimeline =
  mongoose.models.AssignmentTimeline ||
  mongoose.model<IAssignmentTimeline>("AssignmentTimeline", AssignmentTimelineSchema);
