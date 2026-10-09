import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAttendanceSummary extends IBaseDocument {
  student: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  currentStreak: number;
  longestStreak: number;
}

const AttendanceSummarySchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    totalClasses: { type: Number, required: true, default: 0 },
    presentCount: { type: Number, required: true, default: 0 },
    absentCount: { type: Number, required: true, default: 0 },
    lateCount: { type: Number, required: true, default: 0 },
    excusedCount: { type: Number, required: true, default: 0 },
    attendancePercentage: { type: Number, required: true, default: 0 },
    currentStreak: { type: Number, required: true, default: 0 },
    longestStreak: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

AttendanceSummarySchema.index({ student: 1, batch: 1 }, { unique: true });
AttendanceSummarySchema.plugin(baseModelPlugin);

export const AttendanceSummary =
  mongoose.models.AttendanceSummary ||
  mongoose.model<IAttendanceSummary>("AttendanceSummary", AttendanceSummarySchema);
