import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILead extends IBaseDocument {
  leadId: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  gender?: string;
  dob?: Date;
  country: string;
  state: string;
  city: string;
  address?: string;
  interestedCourse: string;
  course?: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  student?: mongoose.Types.ObjectId;
  preferredBatch?: string;
  learningMode: "live" | "hybrid" | "self-paced";
  leadSource: "website" | "landing-page" | "facebook" | "instagram" | "google-ads" | "whatsapp" | "phone" | "walk-in" | "referral" | "partner" | "manual" | "parent-portal";
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  leadOwner?: mongoose.Types.ObjectId; // Counselor
  tags?: string[];
  priority: "low" | "medium" | "high";
  notes?: string;
  status: "new" | "contacted" | "followup" | "qualified" | "demo_scheduled" | "demo_completed" | "application_started" | "application_submitted" | "documents_pending" | "documents_verified" | "admission_offered" | "admission_accepted" | "enrollment_pending" | "enrolled" | "lost" | "closed";
}

const LeadSchema = new Schema(
  {
    leadId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, index: true },
    alternatePhone: { type: String },
    gender: { type: String },
    dob: { type: Date },
    country: { type: String, required: true, default: "USA", index: true },
    state: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    address: { type: String },
    interestedCourse: { type: String, required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Parent", index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", index: true },
    preferredBatch: { type: String },
    learningMode: { type: String, enum: ["live", "hybrid", "self-paced"], default: "live" },
    leadSource: {
      type: String,
      required: true,
      enum: ["website", "landing-page", "facebook", "instagram", "google-ads", "whatsapp", "phone", "walk-in", "referral", "partner", "manual", "parent-portal"],
      default: "website",
      index: true,
    },
    campaign: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    leadOwner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    tags: [{ type: String, index: true }],
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    notes: { type: String },
    status: {
      type: String,
      required: true,
      enum: [
        "new", "contacted", "followup", "qualified", "demo_scheduled", "demo_completed",
        "application_started", "application_submitted", "documents_pending", "documents_verified",
        "admission_offered", "admission_accepted", "enrollment_pending", "enrolled", "lost", "closed"
      ],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

LeadSchema.plugin(baseModelPlugin);

export const Lead =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
