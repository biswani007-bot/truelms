/* eslint-disable @typescript-eslint/no-explicit-any */
import { notificationQueueRepository } from "../../repositories/notification-queue.repository";
import { NotificationQueue } from "../../models/notification-queue.model";
import { TimelineService } from "./timeline.service";
import { PaginationInput } from "../../dtos/pagination.dto";

export class QueueService {
  static async listQueue(paginationInput: PaginationInput) {
    return notificationQueueRepository.paginate(
      paginationInput,
      ["status", "channel"],
      { populate: ["recipient", "template"] }
    );
  }

  static async findQueueItem(id: string) {
    return notificationQueueRepository.findById(id, { populate: ["recipient", "template"] });
  }

  static async enqueue(data: {
    recipientId: string;
    templateId: string;
    channel: "email" | "sms" | "whatsapp" | "push" | "in-app";
    payload: Record<string, unknown>;
    retryInterval?: number;
    maxRetries?: number;
  }) {
    const queueItem = await NotificationQueue.create({
      recipient: data.recipientId as any,
      template: data.templateId as any,
      channel: data.channel,
      payload: data.payload,
      status: "queued",
      retryCount: 0,
      maxRetries: data.maxRetries ?? 3,
      retryInterval: data.retryInterval ?? 60,
      nextAttemptAt: new Date(),
    });

    await TimelineService.logEvent(
      queueItem._id.toString(),
      "queued",
      `Notification queued for delivery via channel: ${data.channel}`
    );

    return queueItem;
  }

  static async cancel(queueId: string) {
    const item = await notificationQueueRepository.findById(queueId);
    if (!item) throw new Error("Queue item not found");
    if (item.status === "delivered" || item.status === "failed") {
      throw new Error(`Cannot cancel item with status: ${item.status}`);
    }

    const updated = await notificationQueueRepository.update(queueId, {
      status: "cancelled",
    } as any);

    await TimelineService.logEvent(
      queueId,
      "cancelled",
      "Notification delivery cancelled by admin"
    );

    return updated;
  }
}
