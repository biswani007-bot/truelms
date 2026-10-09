import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ITeacher extends IBaseDocument {
  user: mongoose.Types.ObjectId; // References authenticated account
  employeeId: string;
  teacherCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  gender: string;
  dob: Date;
  phone: string;
  alternatePhone?: string;
  emergencyContact?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  nationality: string;
  designation: string;
  department: string;
  joiningDate: Date;
  employmentType: "full-time" | "part-time" | "contractor";
  experienceYears: number;
  qualifications: string[];
  certifications?: string[];
  skills: string[];
  languages: string[];
  bio?: string;
  linkedin?: string;
  website?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  status: "active" | "inactive" | "on-leave" | "resigned" | "retired" | "suspended";
  isCounsellor: boolean;
}

const TeacherSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, index: true },
    teacherCode: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, required: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    phone: { type: String, required: true, index: true },
    alternatePhone: { type: String },
    emergencyContact: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    country: { type: String, required: true, default: "USA", index: true },
    postalCode: { type: String, required: true },
    nationality: { type: String, required: true },
    designation: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },
    joiningDate: { type: Date, required: true, index: true },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contractor"],
      required: true,
      default: "full-time",
      index: true,
    },
    experienceYears: { type: Number, required: true, default: 0 },
    qualifications: [{ type: String }],
    certifications: [{ type: String }],
    skills: [{ type: String, index: true }],
    languages: [{ type: String, index: true }],
    bio: { type: String },
    linkedin: { type: String },
    website: { type: String },
    resumeUrl: { type: String },
    portfolioUrl: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "on-leave", "resigned", "retired", "suspended"],
      default: "active",
      index: true,
    },
    isCounsellor: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

TeacherSchema.plugin(baseModelPlugin);

export const Teacher =
  mongoose.models.Teacher || mongoose.model<ITeacher>("Teacher", TeacherSchema);
