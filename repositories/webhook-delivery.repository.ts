import { WebhookDelivery, IWebhookDelivery } from "../models/webhook-delivery.model";
import { BaseRepository } from "./base.repository";

class WebhookDeliveryRepository extends BaseRepository<IWebhookDelivery> {
  constructor() {
    super(WebhookDelivery);
  }
}

export const webhookDeliveryRepository = new WebhookDeliveryRepository();
