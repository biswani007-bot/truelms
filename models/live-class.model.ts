import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILiveClass extends IBaseDocument {
  classCode: string;
  classTitle: string;
  batch: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  cohort?: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  assistantTeacher?: mongoose.Types.ObjectId;
  mentor?: mongoose.Types.ObjectId;
  classNumber: number;
  startDate: Date;
  endDate: Date;
  duration: number; // in minutes
  timezone: string;
  meetingPlatform: "truelern" | "jitsi" | "zoom" | "google-meet" | "teams" | "custom";
  meetingLink: string;
  meetingId?: string;
  meetingPassword?: string;
  recordingEnabled: boolean;
  recordingUrl?: string;
  description?: string;
  status: "scheduled" | "live" | "completed" | "cancelled" | "rescheduled" | "missed" | "archived";
}

const LiveClassSchema = new Schema(
  {
    classCode: { type: String, required: true, unique: true, index: true },
    classTitle: { type: String, required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    cohort: { type: Schema.Types.ObjectId, ref: "Cohort", required: false, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    assistantTeacher: { type: Schema.Types.ObjectId, ref: "Teacher" },
    mentor: { type: Schema.Types.ObjectId, ref: "Teacher" },
    classNumber: { type: Number, required: true, default: 1 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    duration: { type: Number, required: true, default: 60 },
    timezone: { type: String, required: true, default: "UTC" },
    meetingPlatform: {
      type: String,
      enum: ["truelern", "jitsi", "zoom", "google-meet", "teams", "custom"],
      required: true,
      default: "truelern",
      index: true,
    },
    meetingLink: { type: String, required: true },
    meetingId: { type: String },
    meetingPassword: { type: String },
    recordingEnabled: { type: Boolean, required: true, default: true },
    recordingUrl: { type: String },
    description: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled", "rescheduled", "missed", "archived"],
      required: true,
      default: "scheduled",
      index: true,
    },
  },
  { timestamps: true }
);

LiveClassSchema.plugin(baseModelPlugin);

export const LiveClass =
  mongoose.models.LiveClass || mongoose.model<ILiveClass>("LiveClass", LiveClassSchema);
