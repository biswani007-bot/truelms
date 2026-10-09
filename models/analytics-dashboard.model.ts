import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAnalyticsDashboard extends IBaseDocument {
  name: string;
  slug: string;
  description?: string;
  widgets: mongoose.Types.ObjectId[]; // References AnalyticsWidget
  isDefault: boolean;
  visibility: "admin" | "finance" | "academic" | "all";
  owner?: mongoose.Types.ObjectId; // References User
  layout?: Record<string, unknown>; // Grid layout config
}

const AnalyticsDashboardSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    widgets: [{ type: Schema.Types.ObjectId, ref: "AnalyticsWidget" }],
    isDefault: { type: Boolean, required: true, default: false, index: true },
    visibility: {
      type: String,
      enum: ["admin", "finance", "academic", "all"],
      required: true,
      default: "admin",
      index: true,
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    layout: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AnalyticsDashboardSchema.plugin(baseModelPlugin);

export const AnalyticsDashboard =
  mongoose.models.AnalyticsDashboard ||
  mongoose.model<IAnalyticsDashboard>("AnalyticsDashboard", AnalyticsDashboardSchema);
