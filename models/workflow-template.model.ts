import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";
import { WorkflowActionSchema, IWorkflowAction } from "./workflow-action.model";

export interface IWorkflowTemplate extends IBaseDocument {
  name: string;
  description?: string;
  triggerType: string; // e.g. "enrollment-created"
  actions: IWorkflowAction[];
  category: string; // e.g. "academic", "finance", "crm"
}

const WorkflowTemplateSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    triggerType: { type: String, required: true, index: true },
    actions: { type: [WorkflowActionSchema], required: true, default: [] },
    category: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

WorkflowTemplateSchema.plugin(baseModelPlugin);

export const WorkflowTemplate =
  mongoose.models.WorkflowTemplate ||
  mongoose.model<IWorkflowTemplate>("WorkflowTemplate", WorkflowTemplateSchema);
