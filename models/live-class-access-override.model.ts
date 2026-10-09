import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ILiveClassAccessOverride extends IBaseDocument {
  liveClass: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  grantedBy: mongoose.Types.ObjectId;
  reason?: string;
  expiresAt: Date;
}

const LiveClassAccessOverrideSchema = new Schema(
  {
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

LiveClassAccessOverrideSchema.plugin(baseModelPlugin);

export const LiveClassAccessOverride =
  mongoose.models.LiveClassAccessOverride ||
  mongoose.model<ILiveClassAccessOverride>("LiveClassAccessOverride", LiveClassAccessOverrideSchema);
