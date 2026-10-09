import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IFAQ extends IBaseDocument {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

const FAQSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

FAQSchema.plugin(baseModelPlugin);

export const FAQ =
  mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", FAQSchema);
