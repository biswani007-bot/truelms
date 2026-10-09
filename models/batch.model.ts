import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IBatch extends IBaseDocument {
  batchCode: string;
  batchName: string;
  cohort: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  primaryTeacher?: mongoose.Types.ObjectId;
  assistantTeacher?: mongoose.Types.ObjectId;
  mentor?: mongoose.Types.ObjectId;
  language: string;
  timezone: string;
  // Capacity – always sourced from Platform Settings at runtime, stored here as snapshot
  defaultCapacity: number;
  maxCapacity: number;
  minCapacity: number;
  currentStrength: number;
  availableSeats: number;
  reservedSeats: number;
  waitingCount: number;
  batchStart: Date;
  batchEnd: Date;
  description?: string;
  status: "planning" | "open" | "active" | "full" | "waiting-list" | "completed" | "cancelled" | "archived";
}

const BatchSchema = new Schema(
  {
    batchCode: { type: String, required: true, unique: true, index: true },
    batchName: { type: String, required: true, index: true },
    cohort: { type: Schema.Types.ObjectId, ref: "Cohort", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    primaryTeacher: { type: Schema.Types.ObjectId, ref: "Teacher", index: true },
    assistantTeacher: { type: Schema.Types.ObjectId, ref: "Teacher", index: true },
    mentor: { type: Schema.Types.ObjectId, ref: "Teacher", index: true },
    language: { type: String, required: true, default: "en", index: true },
    timezone: { type: String, required: true, default: "UTC", index: true },
    // Capacity snapshot from Platform Settings
    defaultCapacity: { type: Number, required: true, default: 50 },
    maxCapacity: { type: Number, required: true, default: 100 },
    minCapacity: { type: Number, required: true, default: 5 },
    currentStrength: { type: Number, required: true, default: 0 },
    availableSeats: { type: Number, required: true, default: 50 },
    reservedSeats: { type: Number, required: true, default: 0 },
    waitingCount: { type: Number, required: true, default: 0 },
    batchStart: { type: Date, required: true, index: true },
    batchEnd: { type: Date, required: true, index: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["planning", "open", "active", "full", "waiting-list", "completed", "cancelled", "archived"],
      default: "planning",
      index: true,
    },
  },
  { timestamps: true }
);

BatchSchema.plugin(baseModelPlugin);

export const Batch = mongoose.models.Batch || mongoose.model<IBatch>("Batch", BatchSchema);
