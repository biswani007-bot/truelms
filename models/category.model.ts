import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICategory extends IBaseDocument {
  name: string;
  slug: string;
  description?: string;
}

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
  },
  { timestamps: true }
);

CategorySchema.plugin(baseModelPlugin);

export const Category =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
