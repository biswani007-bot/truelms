import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILiveClassAnnouncement extends IBaseDocument {
  liveClass: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: "general" | "homework" | "schedule-change";
  isPinned: boolean;
  sentBy: mongoose.Types.ObjectId; // References User
}

const LiveClassAnnouncementSchema = new Schema(
  {
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass", required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["general", "homework", "schedule-change"],
      required: true,
      default: "general",
      index: true,
    },
    isPinned: { type: Boolean, required: true, default: false },
    sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

LiveClassAnnouncementSchema.plugin(baseModelPlugin);

export const LiveClassAnnouncement =
  mongoose.models.LiveClassAnnouncement ||
  mongoose.model<ILiveClassAnnouncement>("LiveClassAnnouncement", LiveClassAnnouncementSchema);
