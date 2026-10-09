import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILeadTask extends IBaseDocument {
  lead: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  completed: boolean;
  completedAt?: Date;
  assignedUser?: mongoose.Types.ObjectId;
}

const LeadTaskSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true, index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    completed: { type: Boolean, required: true, default: false, index: true },
    completedAt: { type: Date },
    assignedUser: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

LeadTaskSchema.plugin(baseModelPlugin);

export const LeadTask =
  mongoose.models.LeadTask || mongoose.model<ILeadTask>("LeadTask", LeadTaskSchema);
