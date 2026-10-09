import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type QueueStatus = "queued" | "processing" | "delivered" | "failed" | "cancelled" | "retrying";

export interface INotificationQueue extends IBaseDocument {
  recipient: mongoose.Types.ObjectId; // References User
  template: mongoose.Types.ObjectId; // References NotificationTemplate
  channel: "email" | "sms" | "whatsapp" | "push" | "in-app";
  payload: Record<string, unknown>; // Substitution variables
  status: QueueStatus;
  retryCount: number;
  maxRetries: number;
  retryInterval: number; // In seconds
  lastAttemptAt?: Date;
  nextAttemptAt: Date;
  errorMessage?: string;
}

const NotificationQueueSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    template: { type: Schema.Types.ObjectId, ref: "NotificationTemplate", required: true, index: true },
    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp", "push", "in-app"],
      required: true,
      index: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["queued", "processing", "delivered", "failed", "cancelled", "retrying"],
      required: true,
      default: "queued",
      index: true,
    },
    retryCount: { type: Number, required: true, default: 0 },
    maxRetries: { type: Number, required: true, default: 3 },
    retryInterval: { type: Number, required: true, default: 60 }, // 60 seconds
    lastAttemptAt: { type: Date },
    nextAttemptAt: { type: Date, required: true, default: Date.now, index: true },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

NotificationQueueSchema.plugin(baseModelPlugin);

export const NotificationQueue =
  mongoose.models.NotificationQueue ||
  mongoose.model<INotificationQueue>("NotificationQueue", NotificationQueueSchema);
