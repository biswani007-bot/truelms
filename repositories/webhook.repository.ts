import { Webhook, IWebhook } from "../models/webhook.model";
import { BaseRepository } from "./base.repository";

class WebhookRepository extends BaseRepository<IWebhook> {
  constructor() {
    super(Webhook);
  }
}

export const webhookRepository = new WebhookRepository();
