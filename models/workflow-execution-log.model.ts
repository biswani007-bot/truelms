import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IWorkflowExecutionLog extends IBaseDocument {
  execution: mongoose.Types.ObjectId; // References WorkflowExecution
  step: string; // e.g. "Trigger Matched", "Conditions Met", "Action: send-notification"
  status: "info" | "success" | "warn" | "error";
  message: string;
  timestamp: Date;
}

const WorkflowExecutionLogSchema = new Schema(
  {
    execution: { type: Schema.Types.ObjectId, ref: "WorkflowExecution", required: true, index: true },
    step: { type: String, required: true, index: true },
    status: { type: String, enum: ["info", "success", "warn", "error"], required: true, index: true },
    message: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

WorkflowExecutionLogSchema.plugin(baseModelPlugin);

export const WorkflowExecutionLog =
  mongoose.models.WorkflowExecutionLog ||
  mongoose.model<IWorkflowExecutionLog>("WorkflowExecutionLog", WorkflowExecutionLogSchema);
