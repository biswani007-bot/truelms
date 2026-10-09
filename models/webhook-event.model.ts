import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IWebhookEvent extends IBaseDocument {
  eventName: string;
  payload: Record<string, unknown>;
  correlationId: string;
}

const WebhookEventSchema = new Schema(
  {
    eventName: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    correlationId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

WebhookEventSchema.plugin(baseModelPlugin);

export const WebhookEvent =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>("WebhookEvent", WebhookEventSchema);
