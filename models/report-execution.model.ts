import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type ExecutionStatus = "pending" | "running" | "completed" | "failed";

export interface IReportExecution extends IBaseDocument {
  reportDefinition: mongoose.Types.ObjectId;
  executedBy?: mongoose.Types.ObjectId;
  appliedFilters?: Record<string, unknown>;
  status: ExecutionStatus;
  resultSummary?: Record<string, unknown>;
  rowCount: number;
  executionMs?: number;
  errorMessage?: string;
  exportFormat?: "csv" | "json" | "excel" | "pdf";
}

const ReportExecutionSchema = new Schema(
  {
    reportDefinition: {
      type: Schema.Types.ObjectId,
      ref: "ReportDefinition",
      required: true,
      index: true,
    },
    executedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    appliedFilters: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      required: true,
      default: "pending",
      index: true,
    },
    resultSummary: { type: Schema.Types.Mixed },
    rowCount: { type: Number, required: true, default: 0 },
    executionMs: { type: Number },
    errorMessage: { type: String },
    exportFormat: {
      type: String,
      enum: ["csv", "json", "excel", "pdf"],
    },
  },
  { timestamps: true }
);

ReportExecutionSchema.index({ reportDefinition: 1, createdAt: -1 });

ReportExecutionSchema.plugin(baseModelPlugin);

export const ReportExecution =
  mongoose.models.ReportExecution ||
  mongoose.model<IReportExecution>("ReportExecution", ReportExecutionSchema);
