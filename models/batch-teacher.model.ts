import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IBatchTeacher extends IBaseDocument {
  batch: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  role: "primary" | "assistant" | "mentor";
  assignedAt: Date;
  assignedBy?: mongoose.Types.ObjectId;
  isOverride: boolean; // true if manually overriding a rule-assigned teacher
  notes?: string;
  status: "active" | "removed" | "replaced";
}

const BatchTeacherSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    role: {
      type: String,
      enum: ["primary", "assistant", "mentor"],
      required: true,
      default: "primary",
      index: true,
    },
    assignedAt: { type: Date, required: true, default: Date.now },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    isOverride: { type: Boolean, required: true, default: false },
    notes: { type: String },
    status: {
      type: String,
      enum: ["active", "removed", "replaced"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// One active teacher per role per batch
BatchTeacherSchema.index({ batch: 1, teacher: 1, role: 1 }, { unique: true });
BatchTeacherSchema.plugin(baseModelPlugin);

export const BatchTeacher =
  mongoose.models.BatchTeacher || mongoose.model<IBatchTeacher>("BatchTeacher", BatchTeacherSchema);
