import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type ReportCategory =
  | "admissions"
  | "students"
  | "teachers"
  | "courses"
  | "cohorts"
  | "batches"
  | "attendance"
  | "assignments"
  | "assessments"
  | "certificates"
  | "finance"
  | "executive";

export type ReportChartType =
  | "line"
  | "bar"
  | "pie"
  | "area"
  | "stacked-bar"
  | "table"
  | "kpi-card";

export type ReportType =
  | "summary"
  | "detailed"
  | "comparative"
  | "trend"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type ReportVisibility = "admin" | "finance" | "academic" | "all";

export interface IReportDefinition extends IBaseDocument {
  name: string;
  slug: string;
  category: ReportCategory;
  description?: string;
  reportType: ReportType;
  chartType: ReportChartType;
  visibility: ReportVisibility;
  filters?: Record<string, unknown>; // Filter schema definition
  owner?: mongoose.Types.ObjectId;
  isScheduled: boolean;
  lastRunAt?: Date;
  runCount: number;
  tags?: string[];
}

const ReportDefinitionSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: ["admissions", "students", "teachers", "courses", "cohorts", "batches", "attendance", "assignments", "assessments", "certificates", "finance", "executive"],
      required: true,
      index: true,
    },
    description: { type: String },
    reportType: {
      type: String,
      enum: ["summary", "detailed", "comparative", "trend", "daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
      required: true,
      default: "summary",
      index: true,
    },
    chartType: {
      type: String,
      enum: ["line", "bar", "pie", "area", "stacked-bar", "table", "kpi-card"],
      required: true,
      default: "table",
    },
    visibility: {
      type: String,
      enum: ["admin", "finance", "academic", "all"],
      required: true,
      default: "admin",
      index: true,
    },
    filters: { type: Schema.Types.Mixed },
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    isScheduled: { type: Boolean, required: true, default: false, index: true },
    lastRunAt: { type: Date, index: true },
    runCount: { type: Number, required: true, default: 0 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

ReportDefinitionSchema.plugin(baseModelPlugin);

export const ReportDefinition =
  mongoose.models.ReportDefinition ||
  mongoose.model<IReportDefinition>("ReportDefinition", ReportDefinitionSchema);
