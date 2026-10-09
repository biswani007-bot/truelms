import { Schema } from "mongoose";

export interface IWorkflowAction {
  type: "send-notification" | "create-task" | "update-status" | "generate-snapshot" | "queue-approval" | "run-script";
  config: Record<string, unknown>; // Action parameters (template slugs, recipient roles, status fields, etc.)
  order: number;
}

export const WorkflowActionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["send-notification", "create-task", "update-status", "generate-snapshot", "queue-approval", "run-script"],
      required: true,
    },
    config: { type: Schema.Types.Mixed, required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);
