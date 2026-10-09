import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type NotificationChannel = "email" | "sms" | "whatsapp" | "push" | "in-app";

export interface INotificationTemplate extends IBaseDocument {
  name: string;
  slug: string;
  channels: NotificationChannel[];
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: string[];
  version: number;
  language: string;
}

const NotificationTemplateSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    channels: [{
      type: String,
      enum: ["email", "sms", "whatsapp", "push", "in-app"],
      required: true,
    }],
    subjectTemplate: { type: String },
    bodyTemplate: { type: String, required: true },
    variables: [{ type: String }],
    version: { type: Number, required: true, default: 1 },
    language: { type: String, required: true, default: "en", index: true },
  },
  { timestamps: true }
);

NotificationTemplateSchema.plugin(baseModelPlugin);

export const NotificationTemplate =
  mongoose.models.NotificationTemplate ||
  mongoose.model<INotificationTemplate>("NotificationTemplate", NotificationTemplateSchema);
