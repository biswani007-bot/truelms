import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAnnouncement extends IBaseDocument {
  message: string;
  link?: string;
  linkText?: string;
  active: boolean;
  startDate?: Date;
  endDate?: Date;
}

const AnnouncementSchema = new Schema(
  {
    message: { type: String, required: true },
    link: { type: String },
    linkText: { type: String },
    active: { type: Boolean, default: true, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

AnnouncementSchema.plugin(baseModelPlugin);

export const Announcement =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
