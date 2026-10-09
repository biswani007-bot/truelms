import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICertificateVerification extends IBaseDocument {
  certificate: mongoose.Types.ObjectId;
  ipAddress?: string;
  browserInfo?: string;
  verifiedAt: Date;
  status: "success" | "failed";
}

const CertificateVerificationSchema = new Schema(
  {
    certificate: { type: Schema.Types.ObjectId, ref: "Certificate", required: true, index: true },
    ipAddress: { type: String },
    browserInfo: { type: String },
    verifiedAt: { type: Date, required: true, default: Date.now, index: true },
    status: { type: String, enum: ["success", "failed"], required: true, default: "success", index: true },
  },
  { timestamps: true }
);

CertificateVerificationSchema.plugin(baseModelPlugin);

export const CertificateVerification =
  mongoose.models.CertificateVerification ||
  mongoose.model<ICertificateVerification>("CertificateVerification", CertificateVerificationSchema);
