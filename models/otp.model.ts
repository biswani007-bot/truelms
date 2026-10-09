import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IOtp extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  hashedOtp: string;
  purpose: "login" | "verification" | "password_reset";
  channel: "email" | "phone";
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  isUsed: boolean;
}

const OtpSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hashedOtp: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["login", "verification", "password_reset"],
      required: true,
    },
    channel: {
      type: String,
      enum: ["email", "phone"],
      required: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtpSchema.plugin(baseModelPlugin);

export const Otp = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
