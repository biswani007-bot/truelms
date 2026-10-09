import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IScholarship {
  type: "percentage" | "fixed" | "coupon" | "corporate" | "merit" | "need-based";
  value: number; // percentage value or amount
  code?: string;
}

export interface IDiscount {
  type: "early-bird" | "coupon" | "manual" | "corporate" | "referral";
  value: number;
  code?: string;
}

export interface IEnrollment extends IBaseDocument {
  enrollmentNumber: string;
  student: mongoose.Types.ObjectId;
  lead?: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  academicSession: string;
  admissionCounselor?: mongoose.Types.ObjectId; // References User
  scholarship?: IScholarship;
  discount?: IDiscount;
  remarks?: string;
  status: "pending" | "approved" | "rejected" | "waiting-payment" | "confirmed" | "batch-assigned" | "learning-started" | "completed" | "cancelled" | "refunded";
}

const EnrollmentSchema = new Schema(
  {
    enrollmentNumber: { type: String, required: true, unique: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrollmentDate: { type: Date, required: true, default: Date.now, index: true },
    academicSession: { type: String, required: true, index: true },
    admissionCounselor: { type: Schema.Types.ObjectId, ref: "User", index: true },
    scholarship: {
      type: { type: String, enum: ["percentage", "fixed", "coupon", "corporate", "merit", "need-based"] },
      value: { type: Number, default: 0 },
      code: { type: String },
    },
    discount: {
      type: { type: String, enum: ["early-bird", "coupon", "manual", "corporate", "referral"] },
      value: { type: Number, default: 0 },
      code: { type: String },
    },
    remarks: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "waiting-payment", "confirmed", "batch-assigned", "learning-started", "completed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

EnrollmentSchema.plugin(baseModelPlugin);

export const Enrollment =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
