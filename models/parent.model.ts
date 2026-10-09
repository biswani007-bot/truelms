import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IParent extends IBaseDocument {
  user?: mongoose.Types.ObjectId; // References authenticated account once registered
  parentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  occupation?: string;
  organization?: string;
  designation?: string;
  annualIncome?: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  languagePreference: string;
  status: "pending-approval" | "active" | "inactive" | "rejected" | "archived";
  rejectionReason?: string;
  approvalDate?: Date;
  approvedBy?: mongoose.Types.ObjectId;
}

const ParentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    parentId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true, index: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    alternatePhone: { type: String, trim: true },
    occupation: { type: String, trim: true },
    organization: { type: String, trim: true },
    designation: { type: String, trim: true },
    annualIncome: { type: Number },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    country: { type: String, required: true, default: "USA", index: true },
    postalCode: { type: String, required: true },
    languagePreference: { type: String, default: "en" },
    status: {
      type: String,
      enum: ["pending-approval", "active", "inactive", "rejected", "archived"],
      default: "active",
      index: true,
    },
    rejectionReason: { type: String },
    approvalDate: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ParentSchema.plugin(baseModelPlugin);

export const Parent =
  mongoose.models.Parent || mongoose.model<IParent>("Parent", ParentSchema);
