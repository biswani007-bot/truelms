import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IPage extends IBaseDocument {
  title: string;
  slug: string;
  content: string; // Rich-text or HTML content
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  openGraph?: { title?: string; description?: string; image?: string };
  twitterCard?: { title?: string; description?: string; image?: string };
  keywords?: string[];
  ogImage?: string;
  publishedDate?: Date;
  scheduledDate?: Date;
  version: number;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  author?: mongoose.Types.ObjectId;
  template: string;
}

const PageSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    seoTitle: { type: String },
    seoDescription: { type: String },
    canonicalUrl: { type: String },
    openGraph: {
      title: { type: String },
      description: { type: String },
      image: { type: String },
    },
    twitterCard: {
      title: { type: String },
      description: { type: String },
      image: { type: String },
    },
    keywords: [{ type: String }],
    ogImage: { type: String },
    publishedDate: { type: Date, default: Date.now },
    scheduledDate: { type: Date },
    version: { type: Number, default: 1 },
    status: { 
      type: String, 
      enum: ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "SCHEDULED", "ARCHIVED"], 
      default: "DRAFT" 
    },
    author: { type: Schema.Types.ObjectId, ref: "User", index: true },
    template: { type: String, default: "default" },
  },
  { timestamps: true }
);

PageSchema.plugin(baseModelPlugin);

export const Page =
  mongoose.models.Page || mongoose.model<IPage>("Page", PageSchema);
