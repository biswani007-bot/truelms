import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILiveClassRecording extends IBaseDocument {
  liveClass: mongoose.Types.ObjectId;
  recordingUrl: string;
  durationMinutes?: number;
  sizeBytes?: number;
  status: "processing" | "ready" | "failed";
  isPublished: boolean;
}

const LiveClassRecordingSchema = new Schema(
  {
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass", required: true, unique: true, index: true },
    recordingUrl: { type: String, required: true },
    durationMinutes: { type: Number },
    sizeBytes: { type: Number },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      required: true,
      default: "ready",
      index: true,
    },
    isPublished: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true }
);

LiveClassRecordingSchema.plugin(baseModelPlugin);

export const LiveClassRecording =
  mongoose.models.LiveClassRecording ||
  mongoose.model<ILiveClassRecording>("LiveClassRecording", LiveClassRecordingSchema);
