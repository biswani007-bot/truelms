import { NotificationTimeline, INotificationTimeline } from "../models/notification-timeline.model";
import { BaseRepository } from "./base.repository";

class NotificationTimelineRepository extends BaseRepository<INotificationTimeline> {
  constructor() {
    super(NotificationTimeline);
  }
}

export const notificationTimelineRepository = new NotificationTimelineRepository();
