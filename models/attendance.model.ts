import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAttendance extends IBaseDocument {
  attendanceNumber: string;
  liveClass: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  attendanceDate: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  durationAttended?: number; // in minutes
  status: "present" | "absent" | "late" | "excused" | "half-day" | "left-early" | "no-response";
  mode: "manual" | "teacher-marked" | "qr-code" | "auto-sync" | "self-checkin";
  remarks?: string;
}

const AttendanceSchema = new Schema(
  {
    attendanceNumber: { type: String, required: true, unique: true, index: true },
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass", required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    attendanceDate: { type: Date, required: true, index: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    durationAttended: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused", "half-day", "left-early", "no-response"],
      required: true,
      default: "no-response",
      index: true,
    },
    mode: {
      type: String,
      enum: ["manual", "teacher-marked", "qr-code", "auto-sync", "self-checkin"],
      required: true,
      default: "teacher-marked",
      index: true,
    },
    remarks: { type: String },
  },
  { timestamps: true }
);

AttendanceSchema.index({ liveClass: 1, student: 1 }, { unique: true });
AttendanceSchema.plugin(baseModelPlugin);

export const Attendance =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);
