import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAuthor extends IBaseDocument {
  name: string;
  bio: string;
  avatar?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

const AuthorSchema = new Schema(
  {
    name: { type: String, required: true },
    bio: { type: String, required: true },
    avatar: { type: String },
    socialLinks: {
      twitter: { type: String },
      linkedin: { type: String },
      github: { type: String },
    },
  },
  { timestamps: true }
);

AuthorSchema.plugin(baseModelPlugin);

export const Author =
  mongoose.models.Author || mongoose.model<IAuthor>("Author", AuthorSchema);
