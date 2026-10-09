import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type ScheduleFrequency = "daily" | "weekly" | "monthly" | "quarterly";

export interface IReportSchedule extends IBaseDocument {
  reportDefinition: mongoose.Types.ObjectId;
  frequency: ScheduleFrequency;
  recipients: string[]; // Email addresses
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  filters?: Record<string, unknown>;
  notes?: string;
}

const ReportScheduleSchema = new Schema(
  {
    reportDefinition: {
      type: Schema.Types.ObjectId,
      ref: "ReportDefinition",
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly"],
      required: true,
      index: true,
    },
    recipients: [{ type: String }],
    isActive: { type: Boolean, required: true, default: true, index: true },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date, index: true },
    filters: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
);

ReportScheduleSchema.plugin(baseModelPlugin);

export const ReportSchedule =
  mongoose.models.ReportSchedule ||
  mongoose.model<IReportSchedule>("ReportSchedule", ReportScheduleSchema);
