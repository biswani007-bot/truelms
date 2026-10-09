import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IStudentTimeline extends IBaseDocument {
  student: mongoose.Types.ObjectId;
  event: string; // e.g. "registered", "status_change", "document_uploaded", "guardian_updated"
  description: string;
  performedBy?: mongoose.Types.ObjectId;
  timestamp: Date;
}

const StudentTimelineSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    event: { type: String, required: true, index: true },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

StudentTimelineSchema.plugin(baseModelPlugin);

export const StudentTimeline =
  mongoose.models.StudentTimeline || mongoose.model<IStudentTimeline>("StudentTimeline", StudentTimelineSchema);
