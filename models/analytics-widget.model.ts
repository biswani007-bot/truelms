import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type WidgetType =
  | "kpi-card"
  | "line"
  | "bar"
  | "pie"
  | "area"
  | "stacked-bar"
  | "table";

export type WidgetCategory =
  | "admissions"
  | "academic"
  | "finance"
  | "operational"
  | "certificates"
  | "teachers";

export interface IAnalyticsWidget extends IBaseDocument {
  name: string;
  description?: string;
  widgetType: WidgetType;
  category: WidgetCategory;
  dataKey: string; // Identifier used by frontend to fetch data
  config?: Record<string, unknown>; // Chart config metadata (colors, labels, units)
  visibility: "admin" | "finance" | "academic" | "all";
  order: number;
  isSystem: boolean; // System widgets cannot be deleted
}

const AnalyticsWidgetSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    widgetType: {
      type: String,
      enum: ["kpi-card", "line", "bar", "pie", "area", "stacked-bar", "table"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["admissions", "academic", "finance", "operational", "certificates", "teachers"],
      required: true,
      index: true,
    },
    dataKey: { type: String, required: true, unique: true, index: true },
    config: { type: Schema.Types.Mixed },
    visibility: {
      type: String,
      enum: ["admin", "finance", "academic", "all"],
      required: true,
      default: "admin",
      index: true,
    },
    order: { type: Number, required: true, default: 0 },
    isSystem: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

AnalyticsWidgetSchema.plugin(baseModelPlugin);

export const AnalyticsWidget =
  mongoose.models.AnalyticsWidget ||
  mongoose.model<IAnalyticsWidget>("AnalyticsWidget", AnalyticsWidgetSchema);
