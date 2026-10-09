import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ITeacherPerformance extends IBaseDocument {
  teacher: mongoose.Types.ObjectId;
  averageRating: number;
  studentFeedbackCount: number;
  courseCompletionRate: number; // percentage
  attendancePercentage: number;
  assignmentsEvaluatedCount: number;
  averageResponseTimeMinutes: number;
}

const TeacherPerformanceSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, unique: true, index: true },
    averageRating: { type: Number, required: true, default: 5.0, index: true },
    studentFeedbackCount: { type: Number, required: true, default: 0 },
    courseCompletionRate: { type: Number, required: true, default: 100 },
    attendancePercentage: { type: Number, required: true, default: 100 },
    assignmentsEvaluatedCount: { type: Number, required: true, default: 0 },
    averageResponseTimeMinutes: { type: Number, required: true, default: 30 },
  },
  { timestamps: true }
);

TeacherPerformanceSchema.plugin(baseModelPlugin);

export const TeacherPerformance =
  mongoose.models.TeacherPerformance ||
  mongoose.model<ITeacherPerformance>("TeacherPerformance", TeacherPerformanceSchema);
