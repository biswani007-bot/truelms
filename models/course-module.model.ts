import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICourseModule extends IBaseDocument {
  course: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  status: "DRAFT" | "PUBLISHED";
}

const CourseModuleSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true, default: 0, index: true },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "PUBLISHED", index: true },
  },
  { timestamps: true }
);

CourseModuleSchema.plugin(baseModelPlugin);

export const CourseModule =
  mongoose.models.CourseModule || mongoose.model<ICourseModule>("CourseModule", CourseModuleSchema);
