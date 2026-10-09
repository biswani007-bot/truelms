import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IStudentPreference {
  language: string;
  timezone: string;
  notificationPref: "email" | "sms" | "whatsapp" | "none";
  accessibilitySettings?: string;
}

export interface IStudent extends IBaseDocument {
  user: mongoose.Types.ObjectId; // References authenticated account
  studentId: string;
  admissionNumber: string;
  registrationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  dob?: Date;
  bloodGroup?: string;
  nationality?: string;
  maritalStatus?: string;
  phone: string;
  alternatePhone?: string;
  emergencyContact?: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  highestQualification?: string;
  schoolCollege?: string;
  passingYear?: number;
  cgpaPercentage?: number;
  skills?: string[];
  languages?: string[];
  preferences: IStudentPreference;
  status: "prospect" | "registered" | "admission-pending" | "active" | "inactive" | "completed" | "suspended" | "dropped" | "alumni";
}

const StudentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    studentId: { type: String, required: true, unique: true, index: true },
    admissionNumber: { type: String, required: true, unique: true, index: true },
    registrationNumber: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true, index: true },
    middleName: { type: String },
    lastName: { type: String, required: true, index: true },
    gender: { type: String },
    dob: { type: Date },
    bloodGroup: { type: String },
    nationality: { type: String, index: true },
    maritalStatus: { type: String },
    phone: { type: String, required: true, index: true },
    alternatePhone: { type: String },
    emergencyContact: { type: String },
    currentAddress: { type: String },
    permanentAddress: { type: String },
    city: { type: String, index: true },
    state: { type: String, index: true },
    country: { type: String, index: true },
    postalCode: { type: String },
    highestQualification: { type: String },
    schoolCollege: { type: String },
    passingYear: { type: Number },
    cgpaPercentage: { type: Number },
    skills: [{ type: String }],
    languages: [{ type: String }],
    preferences: {
      language: { type: String, required: true, default: "en" },
      timezone: { type: String, required: true, default: "UTC" },
      notificationPref: { type: String, enum: ["email", "sms", "whatsapp", "none"], default: "email" },
      accessibilitySettings: { type: String },
    },
    status: {
      type: String,
      enum: ["prospect", "registered", "admission-pending", "active", "inactive", "completed", "suspended", "dropped", "alumni"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

StudentSchema.plugin(baseModelPlugin);

export const Student =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
