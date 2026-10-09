/* eslint-disable @typescript-eslint/no-explicit-any */
import { notificationRepository } from "../../repositories/notification.repository";
import { Notification, EventSource } from "../../models/notification.model";
import { TemplateService } from "./template.service";
import { PreferenceService } from "./preference.service";
import { QueueService } from "./queue.service";
import { DeliveryService } from "./delivery.service";
import { TimelineService } from "./timeline.service";
import { PaginationInput } from "../../dtos/pagination.dto";

export class NotificationService {
  // ─── Inbox CRUD ─────────────────────────────────────────────────────────────

  static async listInbox(userId: string, paginationInput: PaginationInput) {
    const filters = paginationInput.filters || {};
    filters.recipient = userId;
    paginationInput.filters = filters;

    return notificationRepository.paginate(
      paginationInput,
      ["title", "content", "status"],
      { populate: ["sender"] }
    );
  }

  static async markAsRead(notificationId: string) {
    const notif = await notificationRepository.findById(notificationId);
    if (!notif) throw new Error("Notification not found");

    const updated = await notificationRepository.update(notificationId, {
      readAt: new Date(),
    } as any);

    await TimelineService.logEvent(notificationId, "read", "Notification marked as read by user");
    return updated;
  }

  static async archive(notificationId: string) {
    const notif = await notificationRepository.findById(notificationId);
    if (!notif) throw new Error("Notification not found");

    return notificationRepository.update(notificationId, {
      status: "archived",
      archivedAt: new Date(),
    } as any);
  }

  // ─── Core Trigger Dispatcher ────────────────────────────────────────────────

  /**
   * Central entry point to dispatch notifications.
   * Checks preference constraints, renders templates, and enqueues/dispatches.
   */
  static async sendNotification(
    recipientId: string,
    templateSlug: string,
    eventSource: EventSource,
    payload: Record<string, unknown>,
    senderId?: string
  ): Promise<boolean> {
    // 1. Resolve preference checks
    const prefs = await PreferenceService.getPreferences(recipientId);
    if (!prefs || prefs.muteAll) return false;

    const eventAllowed = prefs.eventPreferences ? prefs.eventPreferences.get(eventSource) : true;
    if (eventAllowed === false) return false; // Event explicitly muted

    // 2. Resolve template settings
    const template = await TemplateService.findTemplateBySlug(templateSlug);
    if (!template) throw new Error(`Template not found for slug "${templateSlug}"`);

    // 3. For each template delivery channel
    for (const channel of template.channels) {
      const channelAllowed = prefs.channelPreferences ? prefs.channelPreferences.get(channel) : true;
      if (channelAllowed === false) continue; // Channel explicitly muted by recipient

      // 4. Render content
      const renderedSubject = TemplateService.render(template.subjectTemplate || "Alert", payload);
      const renderedBody = TemplateService.render(template.bodyTemplate, payload);

      // 5. Create basic In-App inbox record if in-app channel is active
      if (channel === "in-app") {
        const notif = await Notification.create({
          recipient: recipientId as any,
          sender: senderId as any,
          title: renderedSubject,
          content: renderedBody,
          eventSource,
          status: "active",
        });

        await TimelineService.logEvent(
          notif._id.toString(),
          "sent",
          "In-app notification dispatched directly to user inbox",
          notif._id.toString()
        );
      } else {
        // Queue other adapters (email, sms, whatsapp, push)
        const queueItem = await QueueService.enqueue({
          recipientId,
          templateId: template._id.toString(),
          channel,
          payload,
        });

        // Trigger immediate synchronous processing for our stubs
        await DeliveryService.processQueueItem(queueItem._id.toString());
      }
    }

    return true;
  }
}
