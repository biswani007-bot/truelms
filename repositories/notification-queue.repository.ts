import { NotificationQueue, INotificationQueue } from "../models/notification-queue.model";
import { BaseRepository } from "./base.repository";

class NotificationQueueRepository extends BaseRepository<INotificationQueue> {
  constructor() {
    super(NotificationQueue);
  }
}

export const notificationQueueRepository = new NotificationQueueRepository();
