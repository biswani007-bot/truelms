import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICertificateApproval extends IBaseDocument {
  certificate: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  requestedBy?: mongoose.Types.ObjectId; // References User
  approvedBy?: mongoose.Types.ObjectId; // References User
  actionedAt?: Date;
}

const CertificateApprovalSchema = new Schema(
  {
    certificate: { type: Schema.Types.ObjectId, ref: "Certificate", required: true, unique: true, index: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], required: true, default: "pending", index: true },
    remarks: { type: String },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actionedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

CertificateApprovalSchema.plugin(baseModelPlugin);

export const CertificateApproval =
  mongoose.models.CertificateApproval ||
  mongoose.model<ICertificateApproval>("CertificateApproval", CertificateApprovalSchema);
