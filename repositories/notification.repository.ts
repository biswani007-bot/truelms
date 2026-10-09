import { Notification, INotification } from "../models/notification.model";
import { BaseRepository } from "./base.repository";

class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }
}

export const notificationRepository = new NotificationRepository();
