import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type SnapshotType = "daily" | "monthly" | "session" | "financial";

export interface IReportSnapshot extends IBaseDocument {
  name: string;
  snapshotType: SnapshotType;
  referenceDate: Date;
  academicSession?: string;
  data: Record<string, unknown>; // Serialized KPI payload
  generatedBy?: mongoose.Types.ObjectId;
  notes?: string;
}

const ReportSnapshotSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    snapshotType: {
      type: String,
      enum: ["daily", "monthly", "session", "financial"],
      required: true,
      index: true,
    },
    referenceDate: { type: Date, required: true, index: true },
    academicSession: { type: String, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
);

ReportSnapshotSchema.index({ snapshotType: 1, referenceDate: -1 });

ReportSnapshotSchema.plugin(baseModelPlugin);

export const ReportSnapshot =
  mongoose.models.ReportSnapshot ||
  mongoose.model<IReportSnapshot>("ReportSnapshot", ReportSnapshotSchema);
