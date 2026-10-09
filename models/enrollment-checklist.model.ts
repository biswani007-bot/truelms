import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IChecklistItem {
  name: string; // e.g. "Application Form", "Identity Proof"
  status: "pending" | "completed" | "rejected";
  remarks?: string;
}

export interface IEnrollmentChecklist extends IBaseDocument {
  enrollment: mongoose.Types.ObjectId;
  items: IChecklistItem[];
}

const EnrollmentChecklistSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, unique: true, index: true },
    items: [
      {
        name: { type: String, required: true },
        status: { type: String, enum: ["pending", "completed", "rejected"], default: "pending" },
        remarks: { type: String },
      },
    ],
  },
  { timestamps: true }
);

EnrollmentChecklistSchema.plugin(baseModelPlugin);

export const EnrollmentChecklist =
  mongoose.models.EnrollmentChecklist ||
  mongoose.model<IEnrollmentChecklist>("EnrollmentChecklist", EnrollmentChecklistSchema);
