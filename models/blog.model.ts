
import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";
import "./author.model";

export interface IBlog extends IBaseDocument {
  title: string;
  slug: string;
  content: string;
  featured: boolean;
  category: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  tags?: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  readingTime?: number;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  publishedDate?: Date;
  scheduledDate?: Date;
  versionHistory?: { version: number; content: string; updatedBy: mongoose.Types.ObjectId; updatedAt: Date }[];
}

const BlogSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    featured: { type: Boolean, default: false, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "Author", required: true, index: true },
    tags: [{ type: String, index: true }],
    featuredImage: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    readingTime: { type: Number, default: 5 },
    status: { 
      type: String, 
      enum: ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "SCHEDULED", "ARCHIVED"], 
      default: "DRAFT" 
    },
    publishedDate: { type: Date },
    scheduledDate: { type: Date },
    versionHistory: [
      {
        version: { type: Number },
        content: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
        updatedAt: { type: Date, default: Date.now },
      }
    ]
  },
  { timestamps: true }
);

BlogSchema.plugin(baseModelPlugin);

export const Blog =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);
