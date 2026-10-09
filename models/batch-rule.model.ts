import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IBatchRule extends IBaseDocument {
  batch?: mongoose.Types.ObjectId; // null = global default rule from Platform Settings
  ruleKey: string; // e.g. "auto_assign", "waiting_list", "capacity_overflow", "teacher_fallback"
  ruleLabel: string;
  description: string;
  isEnabled: boolean;
  isOverride: boolean; // true = batch-specific override over global settings
  parameters: Record<string, unknown>; // Flexible config bag (e.g. { maxWaiting: 20 })
  appliedAt?: Date;
}

const BatchRuleSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", index: true, default: null },
    ruleKey: { type: String, required: true, index: true },
    ruleLabel: { type: String, required: true },
    description: { type: String, required: true },
    isEnabled: { type: Boolean, required: true, default: true, index: true },
    isOverride: { type: Boolean, required: true, default: false },
    parameters: { type: Schema.Types.Mixed, default: {} },
    appliedAt: { type: Date },
  },
  { timestamps: true }
);

BatchRuleSchema.plugin(baseModelPlugin);

export const BatchRule =
  mongoose.models.BatchRule || mongoose.model<IBatchRule>("BatchRule", BatchRuleSchema);
