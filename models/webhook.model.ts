import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IWebhook extends IBaseDocument {
  apiClient: mongoose.Types.ObjectId; // References ApiClient
  targetUrl: string;
  secret: string; // Used for HMAC-SHA255 signatures
  subscribedEvents: string[]; // e.g. ["enrollment.created", "student.registered"]
  isActive: boolean;
}

const WebhookSchema = new Schema(
  {
    apiClient: { type: Schema.Types.ObjectId, ref: "ApiClient", required: true, index: true },
    targetUrl: { type: String, required: true },
    secret: { type: String, required: true },
    subscribedEvents: [{ type: String, index: true }],
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true }
);

WebhookSchema.plugin(baseModelPlugin);

export const Webhook =
  mongoose.models.Webhook ||
  mongoose.model<IWebhook>("Webhook", WebhookSchema);
