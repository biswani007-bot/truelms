import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAttendanceRule extends IBaseDocument {
  batch?: mongoose.Types.ObjectId; // null = global default from Platform Settings
  ruleKey: "minimumAttendancePercent" | "certificateEligibilityPercent" | "assessmentEligibilityPercent" | "lateThreshold" | "gracePeriod";
  ruleLabel: string;
  value: number; // percentage value or minutes
  isEnabled: boolean;
  isOverride: boolean; // override over global settings
}

const AttendanceRuleSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", index: true, default: null },
    ruleKey: {
      type: String,
      enum: ["minimumAttendancePercent", "certificateEligibilityPercent", "assessmentEligibilityPercent", "lateThreshold", "gracePeriod"],
      required: true,
      index: true,
    },
    ruleLabel: { type: String, required: true },
    value: { type: Number, required: true },
    isEnabled: { type: Boolean, required: true, default: true, index: true },
    isOverride: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

AttendanceRuleSchema.plugin(baseModelPlugin);

export const AttendanceRule =
  mongoose.models.AttendanceRule ||
  mongoose.model<IAttendanceRule>("AttendanceRule", AttendanceRuleSchema);
