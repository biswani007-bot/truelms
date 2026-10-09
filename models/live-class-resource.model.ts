import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILiveClassResource extends IBaseDocument {
  liveClass: mongoose.Types.ObjectId;
  title: string;
  type: "presentation" | "pdf" | "worksheet" | "video" | "link";
  url: string;
  sizeBytes?: number;
  status: "published" | "hidden";
}

const LiveClassResourceSchema = new Schema(
  {
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass", required: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["presentation", "pdf", "worksheet", "video", "link"],
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    sizeBytes: { type: Number },
    status: {
      type: String,
      enum: ["published", "hidden"],
      required: true,
      default: "published",
      index: true,
    },
  },
  { timestamps: true }
);

LiveClassResourceSchema.plugin(baseModelPlugin);

export const LiveClassResource =
  mongoose.models.LiveClassResource ||
  mongoose.model<ILiveClassResource>("LiveClassResource", LiveClassResourceSchema);
