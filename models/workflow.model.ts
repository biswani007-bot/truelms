import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";
import { WorkflowTriggerSchema, IWorkflowTrigger } from "./workflow-trigger.model";
import { WorkflowConditionSchema, IWorkflowCondition } from "./workflow-condition.model";
import { WorkflowActionSchema, IWorkflowAction } from "./workflow-action.model";

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

export interface IWorkflow extends IBaseDocument {
  name: string;
  description?: string;
  trigger: IWorkflowTrigger;
  conditions?: IWorkflowCondition;
  actions: IWorkflowAction[];
  status: WorkflowStatus;
  version: number;
  owner?: mongoose.Types.ObjectId;
}

const WorkflowSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    trigger: { type: WorkflowTriggerSchema, required: true },
    conditions: { type: WorkflowConditionSchema },
    actions: { type: [WorkflowActionSchema], required: true, default: [] },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "archived"],
      required: true,
      default: "draft",
      index: true,
    },
    version: { type: Number, required: true, default: 1 },
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

WorkflowSchema.plugin(baseModelPlugin);

export const Workflow =
  mongoose.models.Workflow ||
  mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
