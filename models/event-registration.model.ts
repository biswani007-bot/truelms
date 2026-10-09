import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IEventRegistration extends IBaseDocument {
  event: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  designation?: string;
  message?: string;
  status: "registered" | "cancelled" | "attended" | "no-show";
  registeredAt: Date;
  ipAddress?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const EventRegistrationSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String },
    company: { type: String },
    designation: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ["registered", "cancelled", "attended", "no-show"],
      default: "registered",
      index: true,
    },
    registeredAt: { type: Date, default: Date.now, index: true },
    ipAddress: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
  },
  { timestamps: true }
);

// Prevent duplicate registration per event
EventRegistrationSchema.index({ event: 1, email: 1 }, { unique: true });

EventRegistrationSchema.plugin(baseModelPlugin);

export const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema);
