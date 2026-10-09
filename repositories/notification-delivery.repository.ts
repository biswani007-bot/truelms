import { NotificationDelivery, INotificationDelivery } from "../models/notification-delivery.model";
import { BaseRepository } from "./base.repository";

class NotificationDeliveryRepository extends BaseRepository<INotificationDelivery> {
  constructor() {
    super(NotificationDelivery);
  }
}

export const notificationDeliveryRepository = new NotificationDeliveryRepository();
