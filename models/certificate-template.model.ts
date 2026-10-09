import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICertificateTemplate extends IBaseDocument {
  code: string;
  name: string;
  credentialType: "course-completion" | "participation" | "achievement" | "excellence" | "workshop" | "seminar" | "internship" | "custom";
  backgroundUrl: string;
  headerText?: string;
  footerText?: string;
  logoUrl?: string;
  signatureUrl?: string;
  qrPosition: {
    x: number;
    y: number;
  };
  dynamicFields: string[];
}

const CertificateTemplateSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    credentialType: {
      type: String,
      enum: [
        "course-completion",
        "participation",
        "achievement",
        "excellence",
        "workshop",
        "seminar",
        "internship",
        "custom",
      ],
      required: true,
      index: true,
    },
    backgroundUrl: { type: String, required: true },
    headerText: { type: String },
    footerText: { type: String },
    logoUrl: { type: String },
    signatureUrl: { type: String },
    qrPosition: {
      x: { type: Number, required: true, default: 50 },
      y: { type: Number, required: true, default: 50 },
    },
    dynamicFields: [{ type: String }],
  },
  { timestamps: true }
);

CertificateTemplateSchema.plugin(baseModelPlugin);

export const CertificateTemplate =
  mongoose.models.CertificateTemplate ||
  mongoose.model<ICertificateTemplate>("CertificateTemplate", CertificateTemplateSchema);
