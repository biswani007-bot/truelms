/* eslint-disable @typescript-eslint/no-explicit-any */
import { notificationDeliveryRepository } from "../../repositories/notification-delivery.repository";
import { NotificationDelivery } from "../../models/notification-delivery.model";
import { notificationQueueRepository } from "../../repositories/notification-queue.repository";
import { getChannelAdapter } from "../../lib/notification-gateway/adapters";
import { TimelineService } from "./timeline.service";
import { PaginationInput } from "../../dtos/pagination.dto";

export class DeliveryService {
  static async listDeliveryHistory(paginationInput: PaginationInput) {
    return notificationDeliveryRepository.paginate(
      paginationInput,
      ["status", "channel"],
      { populate: ["recipient", "queueItem"] }
    );
  }

  /**
   * Dispatches a queued notification item through its channel adapter.
   */
  static async processQueueItem(queueId: string): Promise<boolean> {
    const item = await notificationQueueRepository.findById(queueId, { populate: ["recipient", "template"] });
    if (!item) throw new Error("Queue item not found");
    if (item.status === "delivered" || item.status === "cancelled") return false;

    // Update status to processing
    await notificationQueueRepository.update(queueId, { status: "processing" } as any);

    try {
      const recipientObj = item.recipient as any;
      const templateObj = item.template as any;

      // Determine contact point (email address, phone, or token mock)
      let contactPoint = "unknown";
      if (item.channel === "email") {
        contactPoint = recipientObj?.email || "email@example.com";
      } else if (item.channel === "sms" || item.channel === "whatsapp") {
        contactPoint = recipientObj?.phone || "+1234567890";
      } else {
        contactPoint = `token-${recipientObj?._id?.toString()}`;
      }

      // Render the content
      const renderedSubject = templateObj.subjectTemplate ? templateObj.subjectTemplate : "System Alert";
      const renderedBody = templateObj.bodyTemplate;

      const adapter = getChannelAdapter(item.channel);
      const res = await adapter.send(contactPoint, renderedSubject, renderedBody, item.payload);

      if (res.success) {
        // Mark as delivered
        await notificationQueueRepository.update(queueId, {
          status: "delivered",
          lastAttemptAt: new Date(),
        } as any);

        await NotificationDelivery.create({
          queueItem: queueId as any,
          recipient: recipientObj._id,
          channel: item.channel,
          status: "success",
          deliveredAt: new Date(),
          gatewayResponse: res as any,
        });

        await TimelineService.logEvent(
          queueId,
          "delivered",
          `Notification delivered successfully. Message ID: ${res.gatewayMessageId}`
        );

        return true;
      } else {
        throw new Error(res.error || "Gateway delivery failed");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      const nextAttemptAt = new Date(Date.now() + item.retryInterval * 1000);

      const isFinalFailure = item.retryCount >= item.maxRetries;

      await notificationQueueRepository.update(queueId, {
        status: isFinalFailure ? "failed" : "retrying",
        retryCount: item.retryCount + 1,
        errorMessage: errorMsg,
        lastAttemptAt: new Date(),
        nextAttemptAt,
      } as any);

      await NotificationDelivery.create({
        queueItem: queueId as any,
        recipient: item.recipient as any,
        channel: item.channel,
        status: "failed",
        deliveredAt: new Date(),
        errorMessage: errorMsg,
      });

      await TimelineService.logEvent(
        queueId,
        "failed",
        `Delivery attempt failed: ${errorMsg}. ${isFinalFailure ? "Max retries reached." : "Retrying later."}`
      );

      return false;
    }
  }
}
