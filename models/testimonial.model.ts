import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ITestimonial extends IBaseDocument {
  name: string;
  designation: string;
  company: string;
  photo?: string;
  review: string;
  rating: number;
  featured: boolean;
}

const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    company: { type: String, required: true },
    photo: { type: String },
    review: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

TestimonialSchema.plugin(baseModelPlugin);

export const Testimonial =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);
