import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IBatchStudent extends IBaseDocument {
  batch: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  assignedAt: Date;
  assignedBy?: mongoose.Types.ObjectId;
  assignmentType: "automatic" | "manual";
  seatNumber?: number;
  notes?: string;
  status: "active" | "transferred" | "removed" | "completed";
}

const BatchStudentSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, index: true },
    assignedAt: { type: Date, required: true, default: Date.now },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    assignmentType: {
      type: String,
      enum: ["automatic", "manual"],
      required: true,
      default: "manual",
      index: true,
    },
    seatNumber: { type: Number },
    notes: { type: String },
    status: {
      type: String,
      enum: ["active", "transferred", "removed", "completed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// Unique constraint: one active assignment per student per batch
BatchStudentSchema.index({ batch: 1, student: 1 }, { unique: true });
BatchStudentSchema.plugin(baseModelPlugin);

export const BatchStudent =
  mongoose.models.BatchStudent || mongoose.model<IBatchStudent>("BatchStudent", BatchStudentSchema);
