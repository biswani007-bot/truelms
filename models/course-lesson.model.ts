import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICourseLesson extends IBaseDocument {
  module: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  durationMinutes: number;
  order: number;
  status: "DRAFT" | "PUBLISHED";
  contentType: "video" | "document" | "link" | "text" | "image";
  resourceUrl?: string;
  content?: string;
}

const CourseLessonSchema = new Schema(
  {
    module: { type: Schema.Types.ObjectId, ref: "CourseModule", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    durationMinutes: { type: Number, required: true, default: 60 },
    order: { type: Number, required: true, default: 0, index: true },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "PUBLISHED", index: true },
    contentType: { type: String, enum: ["video", "document", "link", "text", "image"], default: "text" },
    resourceUrl: { type: String },
    content: { type: String },
  },
  { timestamps: true }
);

CourseLessonSchema.plugin(baseModelPlugin);

export const CourseLesson =
  mongoose.models.CourseLesson || mongoose.model<ICourseLesson>("CourseLesson", CourseLessonSchema);
