import { WebhookEvent, IWebhookEvent } from "../models/webhook-event.model";
import { BaseRepository } from "./base.repository";

class WebhookEventRepository extends BaseRepository<IWebhookEvent> {
  constructor() {
    super(WebhookEvent);
  }
}

export const webhookEventRepository = new WebhookEventRepository();
