import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type WebhookDeliveryStatus = "queued" | "delivered" | "failed" | "cancelled" | "retrying";

export interface IWebhookDelivery extends IBaseDocument {
  webhook: mongoose.Types.ObjectId; // References Webhook
  webhookEvent: mongoose.Types.ObjectId; // References WebhookEvent
  payload: Record<string, unknown>;
  attemptNumber: number;
  status: WebhookDeliveryStatus;
  responseStatusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  timestamp: Date;
}

const WebhookDeliverySchema = new Schema(
  {
    webhook: { type: Schema.Types.ObjectId, ref: "Webhook", required: true, index: true },
    webhookEvent: { type: Schema.Types.ObjectId, ref: "WebhookEvent", required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    attemptNumber: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ["queued", "delivered", "failed", "cancelled", "retrying"],
      required: true,
      default: "queued",
      index: true,
    },
    responseStatusCode: { type: Number, index: true },
    responseBody: { type: String },
    errorMessage: { type: String },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

WebhookDeliverySchema.plugin(baseModelPlugin);

export const WebhookDelivery =
  mongoose.models.WebhookDelivery ||
  mongoose.model<IWebhookDelivery>("WebhookDelivery", WebhookDeliverySchema);
