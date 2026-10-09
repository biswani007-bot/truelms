import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type ExecutionStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "skipped";

export interface IWorkflowExecution extends IBaseDocument {
  workflow: mongoose.Types.ObjectId; // References Workflow
  triggerEvent: string;
  context: Record<string, unknown>; // Trigger payload context
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}

const WorkflowExecutionSchema = new Schema(
  {
    workflow: { type: Schema.Types.ObjectId, ref: "Workflow", required: true, index: true },
    triggerEvent: { type: String, required: true, index: true },
    context: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled", "skipped"],
      required: true,
      default: "queued",
      index: true,
    },
    startedAt: { type: Date, required: true, default: Date.now, index: true },
    completedAt: { type: Date },
    durationMs: { type: Number },
  },
  { timestamps: true }
);

WorkflowExecutionSchema.plugin(baseModelPlugin);

export const WorkflowExecution =
  mongoose.models.WorkflowExecution ||
  mongoose.model<IWorkflowExecution>("WorkflowExecution", WorkflowExecutionSchema);
