import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICourseFAQ {
  question: string;
  answer: string;
}

export interface ICourseRequirement {
  eligibility?: string;
  minQualification?: string;
  experience?: string;
  prerequisites?: string[];
  software?: string[];
  hardware?: string[];
}

export interface ICourseOutcome {
  learningOutcomes: string[];
  skills: string[];
  careerOpportunities?: string[];
  certificateDetails?: string;
}

export interface ICoursePricing {
  type: "free" | "one-time" | "subscription" | "scholarship";
  price: number;
  discountPrice?: number;
  currency: string;
  taxPercentage: number;
  validityMonths?: number;
}

export interface ICourseDemoFaculty {
  primaryTeacher?: mongoose.Types.ObjectId;
  eligibleTeachers?: mongoose.Types.ObjectId[];
  backupTeacher?: mongoose.Types.ObjectId;
}

export interface ICourse extends IBaseDocument {
  courseCode: string;
  courseName: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  category: mongoose.Types.ObjectId;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  thumbnail?: string;
  banner?: string;
  promoVideo?: string;
  duration: number;
  durationUnit: "weeks" | "months" | "hours";
  difficulty: "easy" | "medium" | "hard";
  deliveryMode: "live-cohort" | "self-paced" | "hybrid" | "workshop" | "bootcamp";
  certificateAvailable: boolean;
  featured: boolean;
  status: "draft" | "review" | "published" | "archived";
  version: string;
  requirements: ICourseRequirement;
  outcomes: ICourseOutcome;
  pricing: ICoursePricing;
  faqs: ICourseFAQ[];
  instructors: mongoose.Types.ObjectId[]; // References to User (Teachers/Admins)
  demoFaculty?: ICourseDemoFaculty;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

const CourseSchema = new Schema(
  {
    courseCode: { type: String, required: true, unique: true, index: true },
    courseName: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, required: true },
    longDescription: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "CourseCategory", required: true, index: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true, index: true },
    language: { type: String, required: true, default: "English" },
    thumbnail: { type: String },
    banner: { type: String },
    promoVideo: { type: String },
    duration: { type: Number, required: true },
    durationUnit: { type: String, enum: ["weeks", "months", "hours"], default: "weeks", required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium", index: true },
    deliveryMode: {
      type: String,
      enum: ["live-cohort", "self-paced", "hybrid", "workshop", "bootcamp"],
      default: "live-cohort",
      index: true,
    },
    certificateAvailable: { type: Boolean, required: true, default: true },
    featured: { type: Boolean, required: true, default: false, index: true },
    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
      index: true,
    },
    version: { type: String, required: true, default: "1.0.0" },
    requirements: {
      eligibility: { type: String },
      minQualification: { type: String },
      experience: { type: String },
      prerequisites: [{ type: String }],
      software: [{ type: String }],
      hardware: [{ type: String }],
    },
    outcomes: {
      learningOutcomes: [{ type: String }],
      skills: [{ type: String }],
      careerOpportunities: [{ type: String }],
      certificateDetails: { type: String },
    },
    pricing: {
      type: { type: String, enum: ["free", "one-time", "subscription", "scholarship"], default: "one-time" },
      price: { type: Number, required: true, default: 0 },
      discountPrice: { type: Number },
      currency: { type: String, required: true, default: "USD" },
      taxPercentage: { type: Number, required: true, default: 0 },
      validityMonths: { type: Number },
    },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    instructors: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    demoFaculty: {
      primaryTeacher: { type: Schema.Types.ObjectId, ref: "Teacher", index: true },
      eligibleTeachers: [{ type: Schema.Types.ObjectId, ref: "Teacher", index: true }],
      backupTeacher: { type: Schema.Types.ObjectId, ref: "Teacher", index: true },
    },
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: [{ type: String }],
  },
  { timestamps: true }
);

CourseSchema.plugin(baseModelPlugin);

export const Course =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);
