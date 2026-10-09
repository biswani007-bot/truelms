import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IEnrollmentTimeline extends IBaseDocument {
  enrollment: mongoose.Types.ObjectId;
  event: string; // e.g. "created", "approved", "offer_generated", "checklist_updated"
  description: string;
  performedBy?: mongoose.Types.ObjectId;
  timestamp: Date;
}

const EnrollmentTimelineSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, index: true },
    event: { type: String, required: true, index: true },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

EnrollmentTimelineSchema.plugin(baseModelPlugin);

export const EnrollmentTimeline =
  mongoose.models.EnrollmentTimeline ||
  mongoose.model<IEnrollmentTimeline>("EnrollmentTimeline", EnrollmentTimelineSchema);
