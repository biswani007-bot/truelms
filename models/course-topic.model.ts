import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICourseTopic extends IBaseDocument {
  lesson: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  resources?: string[]; // download links/resource files
}

const CourseTopicSchema = new Schema(
  {
    lesson: { type: Schema.Types.ObjectId, ref: "CourseLesson", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true, default: 0, index: true },
    resources: [{ type: String }],
  },
  { timestamps: true }
);

CourseTopicSchema.plugin(baseModelPlugin);

export const CourseTopic =
  mongoose.models.CourseTopic || mongoose.model<ICourseTopic>("CourseTopic", CourseTopicSchema);
