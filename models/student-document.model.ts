import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IStudentDocument extends IBaseDocument {
  student: mongoose.Types.ObjectId;
  documentType: "id_proof" | "transcript" | "birth_certificate" | "address_proof" | "medical_record" | "other";
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  uploadedBy?: mongoose.Types.ObjectId;
}

const StudentDocumentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    documentType: {
      type: String,
      enum: ["id_proof", "transcript", "birth_certificate", "address_proof", "medical_record", "other"],
      required: true,
      default: "id_proof",
      index: true,
    },
    title: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

StudentDocumentSchema.plugin(baseModelPlugin);

export const StudentDocument =
  mongoose.models.StudentDocument ||
  mongoose.model<IStudentDocument>("StudentDocument", StudentDocumentSchema);
