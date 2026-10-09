import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IBatchRecommendation extends IBaseDocument {
  batch: mongoose.Types.ObjectId;
  type:
    | "capacity-warning"
    | "nearly-full"
    | "low-enrollment"
    | "merge-suggestion"
    | "instructor-needed"
    | "overflow-detected"
    | "split-suggestion"
    | "general";
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedNote?: string;
  triggeredByRule?: string; // ruleKey that generated this
  metadata?: Record<string, unknown>;
}

const BatchRecommendationSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    type: {
      type: String,
      enum: [
        "capacity-warning",
        "nearly-full",
        "low-enrollment",
        "merge-suggestion",
        "instructor-needed",
        "overflow-detected",
        "split-suggestion",
        "general",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      required: true,
      default: "info",
      index: true,
    },
    isResolved: { type: Boolean, required: true, default: false, index: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedNote: { type: String },
    triggeredByRule: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

BatchRecommendationSchema.plugin(baseModelPlugin);

export const BatchRecommendation =
  mongoose.models.BatchRecommendation ||
  mongoose.model<IBatchRecommendation>("BatchRecommendation", BatchRecommendationSchema);
