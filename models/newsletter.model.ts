import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface INewsletter extends IBaseDocument {
  email: string;
  firstName?: string;
  status: "pending" | "active" | "unsubscribed";
  verificationToken?: string;
  verifiedAt?: Date;
  source: string; // e.g. "footer-form", "newsletter-page", "blog-cta"
  ipAddress?: string;
  userAgent?: string;
  unsubscribedAt?: Date;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const NewsletterSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    firstName: { type: String },
    status: {
      type: String,
      enum: ["pending", "active", "unsubscribed"],
      default: "pending",
      index: true,
    },
    verificationToken: { type: String, index: true },
    verifiedAt: { type: Date },
    source: { type: String, required: true, default: "website", index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    unsubscribedAt: { type: Date },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
  },
  { timestamps: true }
);

// Unique active subscription per email
NewsletterSchema.index({ email: 1, status: 1 });

NewsletterSchema.plugin(baseModelPlugin);

export const Newsletter =
  mongoose.models.Newsletter || mongoose.model<INewsletter>("Newsletter", NewsletterSchema);
