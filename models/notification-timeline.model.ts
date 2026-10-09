import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type TimelineEvent = "queued" | "sent" | "delivered" | "read" | "failed" | "retried" | "cancelled";

export interface INotificationTimeline extends IBaseDocument {
  notification?: mongoose.Types.ObjectId; // References Notification
  referenceId: mongoose.Types.ObjectId; // References NotificationQueue or NotificationDelivery
  event: TimelineEvent;
  description: string;
  timestamp: Date;
}

const NotificationTimelineSchema = new Schema(
  {
    notification: { type: Schema.Types.ObjectId, ref: "Notification", index: true },
    referenceId: { type: Schema.Types.ObjectId, required: true, index: true },
    event: {
      type: String,
      enum: ["queued", "sent", "delivered", "read", "failed", "retried", "cancelled"],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

NotificationTimelineSchema.plugin(baseModelPlugin);

export const NotificationTimeline =
  mongoose.models.NotificationTimeline ||
  mongoose.model<INotificationTimeline>("NotificationTimeline", NotificationTimelineSchema);
