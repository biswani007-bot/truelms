import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICohortTimeline extends IBaseDocument {
  cohort: mongoose.Types.ObjectId;
  event: string; // e.g. "created", "published", "instructor_assigned", "archived"
  description: string;
  performedBy?: mongoose.Types.ObjectId;
  timestamp: Date;
}

const CohortTimelineSchema = new Schema(
  {
    cohort: { type: Schema.Types.ObjectId, ref: "Cohort", required: true, index: true },
    event: { type: String, required: true, index: true },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

CohortTimelineSchema.plugin(baseModelPlugin);

export const CohortTimeline =
  mongoose.models.CohortTimeline ||
  mongoose.model<ICohortTimeline>("CohortTimeline", CohortTimelineSchema);
