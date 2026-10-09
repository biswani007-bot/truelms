import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILeadTimeline extends IBaseDocument {
  lead: mongoose.Types.ObjectId;
  event: string; // e.g. "created", "assigned", "status_change", "follow_up", "task_created", "document_uploaded"
  description: string;
  performedBy?: mongoose.Types.ObjectId;
  timestamp: Date;
}

const LeadTimelineSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    event: { type: String, required: true, index: true },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

LeadTimelineSchema.plugin(baseModelPlugin);

export const LeadTimeline =
  mongoose.models.LeadTimeline || mongoose.model<ILeadTimeline>("LeadTimeline", LeadTimelineSchema);
