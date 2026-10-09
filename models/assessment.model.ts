import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssessment extends IBaseDocument {
  assessmentCode: string;
  title: string;
  description: string;
  course: mongoose.Types.ObjectId;
  cohort: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  type:
    | "quiz"
    | "practice-test"
    | "unit-test"
    | "module-test"
    | "mid-term"
    | "final-exam"
    | "practical"
    | "oral-viva"
    | "coding-test"
    | "project-evaluation"
    | "custom";
  instructions?: string;
  duration: number; // in minutes
  maximumMarks: number;
  passingMarks: number;
  weightage?: number;
  assessmentDate: Date;
  startTime: Date;
  endTime: Date;
  timezone: string;
  resultPublishDate?: Date;
  attemptLimit: number;
  negativeMarking: boolean;
  randomizationEnabled: boolean;
  visibility: "public" | "restricted";
  status: "draft" | "scheduled" | "published" | "running" | "completed" | "result-published" | "archived";
}

const AssessmentSchema = new Schema(
  {
    assessmentCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    cohort: { type: Schema.Types.ObjectId, ref: "Cohort", required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    type: {
      type: String,
      enum: [
        "quiz",
        "practice-test",
        "unit-test",
        "module-test",
        "mid-term",
        "final-exam",
        "practical",
        "oral-viva",
        "coding-test",
        "project-evaluation",
        "custom",
      ],
      required: true,
      index: true,
    },
    instructions: { type: String },
    duration: { type: Number, required: true, default: 60 },
    maximumMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    weightage: { type: Number, default: 0 },
    assessmentDate: { type: Date, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, required: true, default: "UTC" },
    resultPublishDate: { type: Date },
    attemptLimit: { type: Number, required: true, default: 1 },
    negativeMarking: { type: Boolean, required: true, default: false },
    randomizationEnabled: { type: Boolean, required: true, default: false },
    visibility: { type: String, enum: ["public", "restricted"], required: true, default: "public", index: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "running", "completed", "result-published", "archived"],
      required: true,
      default: "draft",
      index: true,
    },
  },
  { timestamps: true }
);

AssessmentSchema.plugin(baseModelPlugin);

export const Assessment =
  mongoose.models.Assessment || mongoose.model<IAssessment>("Assessment", AssessmentSchema);
