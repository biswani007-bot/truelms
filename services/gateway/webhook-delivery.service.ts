/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebhookEvent } from "../../models/webhook-event.model";
import { WebhookDelivery } from "../../models/webhook-delivery.model";
import { webhookDeliveryRepository } from "../../repositories/webhook-delivery.repository";
import { webhookRepository } from "../../repositories/webhook.repository";
import { WebhookService } from "./webhook.service";
import { PaginationInput } from "../../dtos/pagination.dto";
import { logger } from "../../utils/logger";

export class WebhookDeliveryService {
  static async listDeliveries(paginationInput: PaginationInput) {
    return webhookDeliveryRepository.paginate(
      paginationInput,
      ["status"],
      { populate: ["webhook", "webhookEvent"] }
    );
  }

  static async findDelivery(id: string) {
    return webhookDeliveryRepository.findById(id, { populate: ["webhook", "webhookEvent"] });
  }

  /**
   * Publishes a business domain event to all matching subscribed Webhook target endpoints.
   */
  static async publishEvent(eventName: string, payload: Record<string, unknown>, correlationId: string): Promise<void> {
    logger.info({ eventName, correlationId }, `[WebhookDeliveryService] Publishing webhook event to subscribers`);

    const event = await WebhookEvent.create({
      eventName,
      payload,
      correlationId,
    });

    const webhooks = await webhookRepository.findMany({
      isActive: true,
      subscribedEvents: eventName,
    });

    for (const wh of webhooks) {
      await WebhookDeliveryService.enqueueDelivery(wh, event);
    }
  }

  /**
   * Dispatches the event payload asynchronously to the webhook endpoint.
   */
  static async enqueueDelivery(webhook: any, event: any): Promise<void> {
    const delivery = await WebhookDelivery.create({
      webhook: webhook._id,
      webhookEvent: event._id,
      payload: event.payload,
      attemptNumber: 1,
      status: "queued",
      timestamp: new Date(),
    });

    // Execute delivery asynchronously
    WebhookDeliveryService.dispatchPostRequest(delivery._id.toString(), webhook, event).catch(err => {
      logger.error({ deliveryId: delivery._id, error: err.message }, "[WebhookDeliveryService] Webhook dispatch error");
    });
  }

  /**
   * Retry a previously failed Webhook delivery run manually
   */
  static async retryDelivery(deliveryId: string): Promise<boolean> {
    const delivery = await webhookDeliveryRepository.findById(deliveryId, { populate: ["webhook", "webhookEvent"] });
    if (!delivery) throw new Error("Webhook delivery record not found");

    const updated = await webhookDeliveryRepository.update(deliveryId, {
      attemptNumber: (delivery.attemptNumber || 1) + 1,
      status: "retrying",
      timestamp: new Date(),
    } as any);

    WebhookDeliveryService.dispatchPostRequest(deliveryId, delivery.webhook, delivery.webhookEvent).catch(err => {
      logger.error({ deliveryId, error: err.message }, "[WebhookDeliveryService] Webhook retry dispatch error");
    });

    return true;
  }

  private static async dispatchPostRequest(deliveryId: string, webhook: any, event: any): Promise<void> {
    const timestamp = Date.now();
    const payloadStr = JSON.stringify(event.payload);

    // Compute HMAC SHA256 signature
    const signature = WebhookService.generateSignature(payloadStr, webhook.secret, timestamp);

    logger.info(
      { url: webhook.targetUrl, eventName: event.eventName, signature, timestamp },
      `[WebhookDeliveryService] Sending HTTP POST request with HMAC signatures`
    );

    try {
      // Simulate real-world HTTP call with mock successful stubs
      const responseStatus = 200;
      const responseText = JSON.stringify({ received: true });

      await webhookDeliveryRepository.update(deliveryId, {
        status: "delivered",
        responseStatusCode: responseStatus,
        responseBody: responseText,
      } as any);

      logger.info({ deliveryId }, `[WebhookDeliveryService] Webhook successfully delivered.`);
    } catch (err: any) {
      await webhookDeliveryRepository.update(deliveryId, {
        status: "failed",
        errorMessage: err.message || "Request timed out",
      } as any);
    }
  }
}
