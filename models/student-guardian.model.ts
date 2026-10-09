import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IStudentGuardian extends IBaseDocument {
  student: mongoose.Types.ObjectId;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  guardianName: string;
  guardianRelationship: string;
  guardianOccupation?: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
}

const StudentGuardianSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true, index: true },
    fatherName: { type: String },
    fatherPhone: { type: String },
    fatherEmail: { type: String },
    motherName: { type: String },
    motherPhone: { type: String },
    motherEmail: { type: String },
    guardianName: { type: String, required: true },
    guardianRelationship: { type: String, required: true },
    guardianOccupation: { type: String },
    guardianPhone: { type: String, required: true },
    guardianEmail: { type: String, required: true },
    guardianAddress: { type: String, required: true },
  },
  { timestamps: true }
);

StudentGuardianSchema.plugin(baseModelPlugin);

export const StudentGuardian =
  mongoose.models.StudentGuardian || mongoose.model<IStudentGuardian>("StudentGuardian", StudentGuardianSchema);
