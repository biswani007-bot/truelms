import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IHeroSection extends IBaseDocument {
  pageName: string; // e.g. "home", "about"
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  backgroundImage?: string;
}

const HeroSectionSchema = new Schema(
  {
    pageName: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    ctaText: { type: String },
    ctaLink: { type: String },
    secondaryCtaText: { type: String },
    secondaryCtaLink: { type: String },
    backgroundImage: { type: String },
  },
  { timestamps: true }
);

HeroSectionSchema.plugin(baseModelPlugin);

export const HeroSection =
  mongoose.models.HeroSection || mongoose.model<IHeroSection>("HeroSection", HeroSectionSchema);
