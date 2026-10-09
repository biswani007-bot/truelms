import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IMedia extends IBaseDocument {
  name: string;
  url: string;
  mimeType: string;
  size: number;
  folder?: string;
  altText?: string;
  caption?: string;
  usageCount: number;
}

const MediaSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true, index: true },
    size: { type: Number, required: true },
    folder: { type: String, default: "uploads", index: true },
    altText: { type: String },
    caption: { type: String },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MediaSchema.plugin(baseModelPlugin);

export const Media =
  mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);
