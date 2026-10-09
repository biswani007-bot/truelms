import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface INotificationDelivery extends IBaseDocument {
  queueItem: mongoose.Types.ObjectId; // References NotificationQueue
  recipient: mongoose.Types.ObjectId; // References User
  channel: string;
  status: "success" | "failed";
  deliveredAt: Date;
  errorMessage?: string;
  gatewayResponse?: Record<string, unknown>;
}

const NotificationDeliverySchema = new Schema(
  {
    queueItem: { type: Schema.Types.ObjectId, ref: "NotificationQueue", required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    channel: { type: String, required: true, index: true },
    status: { type: String, enum: ["success", "failed"], required: true, index: true },
    deliveredAt: { type: Date, required: true, default: Date.now, index: true },
    errorMessage: { type: String },
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationDeliverySchema.plugin(baseModelPlugin);

export const NotificationDelivery =
  mongoose.models.NotificationDelivery ||
  mongoose.model<INotificationDelivery>("NotificationDelivery", NotificationDeliverySchema);
