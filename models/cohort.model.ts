import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICohortSettings {
  recordingEnabled: boolean;
  attendanceRequired: boolean;
  certificateEnabled: boolean;
  assignmentEnabled: boolean;
  assessmentEnabled: boolean;
  discussionEnabled: boolean;
}

export interface ICohort extends IBaseDocument {
  cohortCode: string;
  cohortName: string;
  course: mongoose.Types.ObjectId;
  academicSession: mongoose.Types.ObjectId; // References AcademicSession
  startDate: Date;
  endDate: Date;
  orientationDate?: Date;
  enrollmentStart: Date;
  enrollmentEnd: Date;
  maxCapacity: number;
  minCapacity: number;
  currentEnrollment: number;
  language: string;
  timezone: string;
  deliveryMode: "live-online" | "hybrid" | "self-paced";
  certificateEligible: boolean;
  settings: ICohortSettings;
  primaryInstructor: mongoose.Types.ObjectId; // References Teacher
  assistantInstructors?: mongoose.Types.ObjectId[]; // References Teacher
  status: "planning" | "enrollment-open" | "enrollment-closed" | "confirmed" | "running" | "completed" | "cancelled" | "archived";
}

const CohortSchema = new Schema(
  {
    cohortCode: { type: String, required: true, unique: true, index: true },
    cohortName: { type: String, required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    academicSession: { type: Schema.Types.ObjectId, ref: "AcademicSession", required: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    orientationDate: { type: Date },
    enrollmentStart: { type: Date, required: true },
    enrollmentEnd: { type: Date, required: true },
    maxCapacity: { type: Number, required: true, default: 50 },
    minCapacity: { type: Number, required: true, default: 5 },
    currentEnrollment: { type: Number, required: true, default: 0 },
    language: { type: String, required: true, default: "en", index: true },
    timezone: { type: String, required: true, default: "UTC", index: true },
    deliveryMode: {
      type: String,
      enum: ["live-online", "hybrid", "self-paced"],
      required: true,
      default: "live-online",
      index: true,
    },
    certificateEligible: { type: Boolean, default: true },
    settings: {
      recordingEnabled: { type: Boolean, default: true },
      attendanceRequired: { type: Boolean, default: true },
      certificateEnabled: { type: Boolean, default: true },
      assignmentEnabled: { type: Boolean, default: true },
      assessmentEnabled: { type: Boolean, default: true },
      discussionEnabled: { type: Boolean, default: true },
    },
    primaryInstructor: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    assistantInstructors: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],
    status: {
      type: String,
      enum: ["planning", "enrollment-open", "enrollment-closed", "confirmed", "running", "completed", "cancelled", "archived"],
      default: "planning",
      index: true,
    },
  },
  { timestamps: true }
);

CohortSchema.plugin(baseModelPlugin);

export const Cohort =
  mongoose.models.Cohort || mongoose.model<ICohort>("Cohort", CohortSchema);
