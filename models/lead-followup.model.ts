import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILeadFollowUp extends IBaseDocument {
  lead: mongoose.Types.ObjectId;
  date: Date;
  mode: "phone" | "whatsapp" | "email" | "meeting" | "zoom" | "google-meet";
  outcome: string;
  remarks?: string;
  nextFollowUp?: Date;
  assignedUser?: mongoose.Types.ObjectId;
}

const LeadFollowUpSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    mode: {
      type: String,
      required: true,
      enum: ["phone", "whatsapp", "email", "meeting", "zoom", "google-meet"],
      default: "phone",
      index: true,
    },
    outcome: { type: String, required: true },
    remarks: { type: String },
    nextFollowUp: { type: Date, index: true },
    assignedUser: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

LeadFollowUpSchema.plugin(baseModelPlugin);

export const LeadFollowUp =
  mongoose.models.LeadFollowUp || mongoose.model<ILeadFollowUp>("LeadFollowUp", LeadFollowUpSchema);
