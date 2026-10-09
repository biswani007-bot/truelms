import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IDemoSession extends IBaseDocument {
  demoCode: string;
  lead: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  student?: mongoose.Types.ObjectId;
  teacher?: mongoose.Types.ObjectId;
  interestedCourse?: string;
  course?: mongoose.Types.ObjectId;
  scheduledStart: Date;
  scheduledEnd: Date;
  duration: number; // minutes
  actualDurationSeconds?: number;
  firstJoinTime?: Date;
  lastLeaveTime?: Date;
  jitsiEventsProcessed?: string[];
  meetingPlatform: "truelern" | "jitsi" | "zoom" | "google-meet" | "teams" | "custom";
  meetingLink: string;
  meetingId?: string;
  meetingPassword?: string;
  status: "available" | "scheduled" | "live" | "completed" | "cancelled" | "missed";
}

const DemoSessionSchema = new Schema(
  {
    demoCode: { type: String, required: true, unique: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Parent", index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", index: true },
    interestedCourse: { type: String },
    course: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    scheduledStart: { type: Date, required: true, index: true },
    scheduledEnd: { type: Date, required: true, index: true },
    duration: { type: Number, required: true, default: 45 },
    actualDurationSeconds: { type: Number, default: 0 },
    firstJoinTime: { type: Date },
    lastLeaveTime: { type: Date },
    jitsiEventsProcessed: [{ type: String }],
    meetingPlatform: {
      type: String,
      enum: ["truelern", "jitsi", "zoom", "google-meet", "teams", "custom"],
      required: true,
      default: "jitsi",
      index: true,
    },
    meetingLink: { type: String, required: true },
    meetingId: { type: String },
    meetingPassword: { type: String },
    status: {
      type: String,
      enum: ["available", "scheduled", "live", "completed", "cancelled", "missed"],
      required: true,
      default: "scheduled",
      index: true,
    },
  },
  { timestamps: true }
);

DemoSessionSchema.plugin(baseModelPlugin);

if (mongoose.models && mongoose.models.DemoSession) {
  delete (mongoose.models as any).DemoSession;
}

export const DemoSession =
  mongoose.model<IDemoSession>("DemoSession", DemoSessionSchema);
