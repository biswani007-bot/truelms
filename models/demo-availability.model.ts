import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IDemoAvailability extends IBaseDocument {
  slotDate: Date;
  startTime: string;
  endTime: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  duration: number; // minutes
  timezone: string;
  teacher?: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  status: "available" | "booked" | "cancelled";
  capacity: number;
  bookedCount: number;
  bookedDemoSession?: mongoose.Types.ObjectId;
}

const DemoAvailabilitySchema = new Schema(
  {
    slotDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    scheduledStart: { type: Date, required: true, index: true },
    scheduledEnd: { type: Date, required: true, index: true },
    duration: { type: Number, required: true, default: 45 },
    timezone: { type: String, default: "UTC" },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    status: {
      type: String,
      enum: ["available", "booked", "cancelled"],
      required: true,
      default: "available",
      index: true,
    },
    capacity: { type: Number, required: true, default: 1 },
    bookedCount: { type: Number, required: true, default: 0 },
    bookedDemoSession: { type: Schema.Types.ObjectId, ref: "DemoSession", index: true },
  },
  { timestamps: true }
);

// Prevent duplicate slots for the same date/time and optional host/course
DemoAvailabilitySchema.index(
  { scheduledStart: 1, teacher: 1, course: 1, isDeleted: 1 },
  { unique: true }
);

DemoAvailabilitySchema.plugin(baseModelPlugin);

export const DemoAvailability =
  mongoose.models.DemoAvailability ||
  mongoose.model<IDemoAvailability>("DemoAvailability", DemoAvailabilitySchema);
