import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICourseCategory extends IBaseDocument {
  name: string;
  slug: string;
  description?: string;
  status: "ACTIVE" | "ARCHIVED";
}

const CourseCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);

CourseCategorySchema.plugin(baseModelPlugin);

export const CourseCategory =
  mongoose.models.CourseCategory || mongoose.model<ICourseCategory>("CourseCategory", CourseCategorySchema);
