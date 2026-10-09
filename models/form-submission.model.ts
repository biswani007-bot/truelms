import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IFormSubmission extends IBaseDocument {
  formType:
    | "contact"
    | "apply"
    | "demo"
    | "newsletter"
    | "event-registration"
    | "callback"
    | "brochure"
    | "campus-visit";
  data: Record<string, unknown>;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  leadId?: string; // The CRM lead ID generated (if applicable)
  status: "received" | "processed" | "failed";
  errorMessage?: string;
}

const FormSubmissionSchema = new Schema(
  {
    formType: {
      type: String,
      required: true,
      enum: [
        "contact",
        "apply",
        "demo",
        "newsletter",
        "event-registration",
        "callback",
        "brochure",
        "campus-visit",
      ],
      index: true,
    },
    data: { type: Schema.Types.Mixed, required: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    utmTerm: { type: String },
    utmContent: { type: String },
    referrer: { type: String },
    leadId: { type: String, index: true },
    status: {
      type: String,
      enum: ["received", "processed", "failed"],
      default: "received",
      index: true,
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

FormSubmissionSchema.plugin(baseModelPlugin);

export const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model<IFormSubmission>("FormSubmission", FormSubmissionSchema);
