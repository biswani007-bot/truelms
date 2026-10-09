import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IFeePlan extends IBaseDocument {
  code: string;
  course: mongoose.Types.ObjectId;
  academicSession: string;
  currency: string;
  baseFee: number; // Stored in cents (e.g. 100000 = $1,000.00)
  registrationFee: number;
  materialFee: number;
  labFee: number;
  examFee: number;
  tax: number;
  discountRules?: string; // Rules configurations description
  installmentRules?: string; // Installments intervals description
  lateFeeRules?: string; // Late fee penalty rules
}

const FeePlanSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    academicSession: { type: String, required: true },
    currency: { type: String, required: true, default: "USD" },
    baseFee: { type: Number, required: true, default: 0 },
    registrationFee: { type: Number, required: true, default: 0 },
    materialFee: { type: Number, required: true, default: 0 },
    labFee: { type: Number, required: true, default: 0 },
    examFee: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    discountRules: { type: String },
    installmentRules: { type: String },
    lateFeeRules: { type: String },
  },
  { timestamps: true }
);

FeePlanSchema.plugin(baseModelPlugin);

export const FeePlan =
  mongoose.models.FeePlan || mongoose.model<IFeePlan>("FeePlan", FeePlanSchema);
