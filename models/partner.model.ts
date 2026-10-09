import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IPartner extends IBaseDocument {
  name: string;
  logo?: string;
  url?: string;
  type: "recruiter" | "sponsor" | "accreditation" | "industry" | "media";
  description?: string;
  featured: boolean;
  order: number;
  status: "active" | "inactive";
}

const PartnerSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    logo: { type: String },
    url: { type: String },
    type: {
      type: String,
      required: true,
      enum: ["recruiter", "sponsor", "accreditation", "industry", "media"],
      default: "industry",
      index: true,
    },
    description: { type: String },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true }
);

PartnerSchema.plugin(baseModelPlugin);

export const Partner =
  mongoose.models.Partner || mongoose.model<IPartner>("Partner", PartnerSchema);
