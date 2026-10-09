import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILiveClassSchedule extends IBaseDocument {
  batch: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  recurrenceRule: "one-time" | "daily" | "weekly" | "monthly" | "custom";
  recurrenceConfig?: {
    daysOfWeek?: number[]; // 0=Sunday, 1=Monday...
    interval?: number;     // e.g. every 2 weeks
    dates?: Date[];        // for custom dates
  };
  startRange: Date;
  endRange: Date;
  templateMeetingDetails: {
    meetingPlatform: "zoom" | "google-meet" | "teams" | "custom";
    meetingLink: string;
    meetingId?: string;
    meetingPassword?: string;
  };
}

const LiveClassScheduleSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, unique: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    recurrenceRule: {
      type: String,
      enum: ["one-time", "daily", "weekly", "monthly", "custom"],
      required: true,
      default: "weekly",
      index: true,
    },
    recurrenceConfig: {
      daysOfWeek: [{ type: Number }],
      interval: { type: Number, default: 1 },
      dates: [{ type: Date }],
    },
    startRange: { type: Date, required: true },
    endRange: { type: Date, required: true },
    templateMeetingDetails: {
      meetingPlatform: { type: String, enum: ["zoom", "google-meet", "teams", "custom"], required: true },
      meetingLink: { type: String, required: true },
      meetingId: { type: String },
      meetingPassword: { type: String },
    },
  },
  { timestamps: true }
);

LiveClassScheduleSchema.plugin(baseModelPlugin);

export const LiveClassSchedule =
  mongoose.models.LiveClassSchedule ||
  mongoose.model<ILiveClassSchedule>("LiveClassSchedule", LiveClassScheduleSchema);
