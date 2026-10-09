/* eslint-disable @typescript-eslint/no-explicit-any */
import { notificationTimelineRepository } from "../../repositories/notification-timeline.repository";
import { NotificationTimeline, TimelineEvent } from "../../models/notification-timeline.model";
import { PaginationInput } from "../../dtos/pagination.dto";

export class TimelineService {
  static async listTimeline(paginationInput: PaginationInput) {
    return notificationTimelineRepository.paginate(
      paginationInput,
      ["event"],
      { populate: ["notification"] }
    );
  }

  static async logEvent(
    referenceId: string,
    event: TimelineEvent,
    description: string,
    notificationId?: string
  ) {
    return NotificationTimeline.create({
      notification: notificationId as any,
      referenceId: referenceId as any,
      event,
      description,
      timestamp: new Date(),
    });
  }
}
