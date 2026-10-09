import { NotificationPreference, INotificationPreference } from "../models/notification-preference.model";
import { BaseRepository } from "./base.repository";

class NotificationPreferenceRepository extends BaseRepository<INotificationPreference> {
  constructor() {
    super(NotificationPreference);
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository();
