import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IGradeScale extends IBaseDocument {
  code: string;
  name: string;
  minPercentage: number;
  maxPercentage: number;
  gradeKey: string; // A+, A, B, etc.
}

const GradeScaleSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    minPercentage: { type: Number, required: true },
    maxPercentage: { type: Number, required: true },
    gradeKey: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

GradeScaleSchema.plugin(baseModelPlugin);

export const GradeScale =
  mongoose.models.GradeScale || mongoose.model<IGradeScale>("GradeScale", GradeScaleSchema);
