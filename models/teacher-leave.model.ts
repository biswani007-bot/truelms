import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ITeacherLeave extends IBaseDocument {
  teacher: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  leaveType: "sick" | "casual" | "annual" | "unpaid";
  status: "pending" | "approved" | "rejected";
  remarks?: string;
}

const TeacherLeaveSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    leaveType: { type: String, enum: ["sick", "casual", "annual", "unpaid"], required: true, index: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

TeacherLeaveSchema.plugin(baseModelPlugin);

export const TeacherLeave =
  mongoose.models.TeacherLeave || mongoose.model<ITeacherLeave>("TeacherLeave", TeacherLeaveSchema);
