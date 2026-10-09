import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IStudentMedical extends IBaseDocument {
  student: mongoose.Types.ObjectId;
  medicalConditions?: string[];
  allergies?: string[];
  disabilities?: string[];
  specialRequirements?: string;
  emergencyMedicalNotes?: string;
}

const StudentMedicalSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true, index: true },
    medicalConditions: [{ type: String }],
    allergies: [{ type: String }],
    disabilities: [{ type: String }],
    specialRequirements: { type: String },
    emergencyMedicalNotes: { type: String },
  },
  { timestamps: true }
);

StudentMedicalSchema.plugin(baseModelPlugin);

export const StudentMedical =
  mongoose.models.StudentMedical || mongoose.model<IStudentMedical>("StudentMedical", StudentMedicalSchema);
