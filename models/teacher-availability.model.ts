import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ITeacherAvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface ITeacherAvailability extends IBaseDocument {
  teacher: mongoose.Types.ObjectId;
  weeklySchedule: ITeacherAvailabilitySlot[];
  unavailableDates?: Date[];
  maxWeeklyHours: number;
  maxDailyHours: number;
}

const TeacherAvailabilitySchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, unique: true, index: true },
    weeklySchedule: [
      {
        dayOfWeek: { type: Number, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
    unavailableDates: [{ type: Date }],
    maxWeeklyHours: { type: Number, required: true, default: 40 },
    maxDailyHours: { type: Number, required: true, default: 8 },
  },
  { timestamps: true }
);

TeacherAvailabilitySchema.plugin(baseModelPlugin);

export const TeacherAvailability =
  mongoose.models.TeacherAvailability ||
  mongoose.model<ITeacherAvailability>("TeacherAvailability", TeacherAvailabilitySchema);
