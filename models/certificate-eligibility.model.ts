import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICertificateEligibility extends IBaseDocument {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  attendancePercentage: number;
  assignmentCompletionRate: number;
  assessmentPassStatus: boolean;
  overallGrade?: string;
  courseCompleted: boolean;
  isEligible: boolean;
  calculatedAt: Date;
}

const CertificateEligibilitySchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, unique: true, index: true },
    attendancePercentage: { type: Number, required: true, default: 0 },
    assignmentCompletionRate: { type: Number, required: true, default: 0 },
    assessmentPassStatus: { type: Boolean, required: true, default: false },
    overallGrade: { type: String },
    courseCompleted: { type: Boolean, required: true, default: false },
    isEligible: { type: Boolean, required: true, default: false, index: true },
    calculatedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

CertificateEligibilitySchema.plugin(baseModelPlugin);

export const CertificateEligibility =
  mongoose.models.CertificateEligibility ||
  mongoose.model<ICertificateEligibility>("CertificateEligibility", CertificateEligibilitySchema);
