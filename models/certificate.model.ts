import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICertificateCustomization {
  title?: string;
  subtitle?: string;
  courseDisplayName?: string;
  achievementWording?: string;
  instructorDisplayName?: string;
  instructorTitle?: string;
  signatoryDisplayName?: string;
  signatoryTitle?: string;
  institutionName?: string;
  footerWording?: string;
}

export interface ICertificate extends IBaseDocument {
  certificateNumber: string;
  certificateUuid: string;
  student: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  cohort: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  issueDate: Date;
  completionDate: Date;
  expiryDate?: Date;
  status: "draft" | "eligible" | "issued" | "revoked" | "expired" | "archived";
  verificationCode: string;
  qrCodeMetadata?: string; // QR code validation contents metadata
  template: mongoose.Types.ObjectId;
  grade?: string;
  percentage?: number;
  cgpa?: number;
  remarks?: string;
  issuedBy?: mongoose.Types.ObjectId; // References User
  approvedBy?: mongoose.Types.ObjectId; // References User
  customization?: ICertificateCustomization;
  previousCertificate?: mongoose.Types.ObjectId; // For Revise & Reissue
  revisionNumber?: number;
  revisionReason?: string;
  revocationReason?: string;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
}

const CertificateSchema = new Schema(
  {
    certificateNumber: { type: String, required: true, unique: true, index: true },
    certificateUuid: { type: String, required: true, unique: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    cohort: { type: Schema.Types.ObjectId, ref: "Cohort", required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    issueDate: { type: Date, required: true, default: Date.now, index: true },
    completionDate: { type: Date, required: true, index: true },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ["draft", "eligible", "issued", "revoked", "expired", "archived"],
      required: true,
      default: "draft",
      index: true,
    },
    verificationCode: { type: String, required: true, unique: true, index: true },
    qrCodeMetadata: { type: String },
    template: { type: Schema.Types.ObjectId, ref: "CertificateTemplate", required: true, index: true },
    grade: { type: String },
    percentage: { type: Number },
    cgpa: { type: Number },
    remarks: { type: String },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    customization: {
      title: { type: String },
      subtitle: { type: String },
      courseDisplayName: { type: String },
      achievementWording: { type: String },
      instructorDisplayName: { type: String },
      instructorTitle: { type: String },
      signatoryDisplayName: { type: String },
      signatoryTitle: { type: String },
      institutionName: { type: String },
      footerWording: { type: String },
    },
    previousCertificate: { type: Schema.Types.ObjectId, ref: "Certificate" },
    revisionNumber: { type: Number, default: 1 },
    revisionReason: { type: String },
    revocationReason: { type: String },
    revokedAt: { type: Date },
    revokedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

CertificateSchema.plugin(baseModelPlugin);

export const Certificate =
  mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", CertificateSchema);
