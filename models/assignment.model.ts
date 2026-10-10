import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";
import "./course.model";
import "./cohort.model";
import "./batch.model";
import "./teacher.model";
import "./live-class.model";

export interface IAssignment extends IBaseDocument {
  assignmentCode: string;
  title: string;
  description: string;
  course: mongoose.Types.ObjectId;
  cohort: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  liveClass?: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  type: "homework" | "project" | "lab" | "case-study" | "presentation" | "coding-exercise" | "essay" | "quiz-prep" | "custom";
  instructions?: string;
  totalMarks: number;
  passingMarks: number;
  weightage?: number; // percent value for final grade weight
  difficultyLevel: "easy" | "medium" | "hard";
  releaseDate: Date;
  dueDate: Date;
  lateSubmissionAllowed: boolean;
  latePenalty?: number; // percentage penalty per day
  maxAttempts: number;
  visibility: "public" | "restricted";
  status: "draft" | "scheduled" | "published" | "closed" | "archived";
}

const AssignmentSchema = new Schema(
  {
    assignmentCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    cohort: { type: Schema.Types.ObjectId, ref: "Cohort", required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass" },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    type: {
      type: String,
      enum: ["homework", "project", "lab", "case-study", "presentation", "coding-exercise", "essay", "quiz-prep", "custom"],
      required: true,
      index: true,
    },
    instructions: { type: String },
    totalMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    weightage: { type: Number, default: 0 },
    difficultyLevel: { type: String, enum: ["easy", "medium", "hard"], required: true, default: "medium", index: true },
    releaseDate: { type: Date, required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    lateSubmissionAllowed: { type: Boolean, required: true, default: true },
    latePenalty: { type: Number, default: 0 },
    maxAttempts: { type: Number, required: true, default: 1 },
    visibility: { type: String, enum: ["public", "restricted"], required: true, default: "public", index: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "closed", "archived"],
      required: true,
      default: "draft",
      index: true,
    },
  },
  { timestamps: true }
);

AssignmentSchema.plugin(baseModelPlugin);

export const Assignment =
  mongoose.models.Assignment || mongoose.model<IAssignment>("Assignment", AssignmentSchema);
