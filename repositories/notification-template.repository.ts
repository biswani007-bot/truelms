import { NotificationTemplate, INotificationTemplate } from "../models/notification-template.model";
import { BaseRepository } from "./base.repository";

class NotificationTemplateRepository extends BaseRepository<INotificationTemplate> {
  constructor() {
    super(NotificationTemplate);
  }
}

export const notificationTemplateRepository = new NotificationTemplateRepository();
