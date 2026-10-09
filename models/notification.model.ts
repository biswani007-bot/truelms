import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type EventSource =
  | "admissions"
  | "enrollment"
  | "attendance"
  | "assignment"
  | "assessment"
  | "certificate"
  | "finance"
  | "reports"
  | "counselling";

export interface INotification extends IBaseDocument {
  recipient: mongoose.Types.ObjectId; // References User
  sender?: mongoose.Types.ObjectId; // References User (or system)
  title: string;
  content: string;
  eventSource: EventSource;
  readAt?: Date;
  archivedAt?: Date;
  status: "sent" | "failed" | "archived" | "active";
}

const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    eventSource: {
      type: String,
      enum: ["admissions", "enrollment", "attendance", "assignment", "assessment", "certificate", "finance", "reports", "counselling"],
      required: true,
      index: true,
    },
    readAt: { type: Date, index: true },
    archivedAt: { type: Date, index: true },
    status: {
      type: String,
      enum: ["sent", "failed", "archived", "active"],
      required: true,
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

NotificationSchema.plugin(baseModelPlugin);

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
