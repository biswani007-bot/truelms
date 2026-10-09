import { Schema } from "mongoose";

export interface IWorkflowTrigger {
  type: string; // e.g. "enrollment-created", "attendance-alert", "invoice-generated", "payment-received"
  config?: Record<string, unknown>; // Trigger specific filters
}

export const WorkflowTriggerSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    config: { type: Schema.Types.Mixed },
  },
  { _id: false }
);
