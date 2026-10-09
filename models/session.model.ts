import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ISession extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  sessionId: string;
  refreshTokenHash: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  isRevoked: boolean;
}

const SessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    refreshTokenHash: { type: String, required: true },
    deviceName: { type: String, trim: true },
    platform: { type: String, trim: true },
    appVersion: { type: String, trim: true },
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SessionSchema.plugin(baseModelPlugin);

export const Session =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
