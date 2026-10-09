import { ActivityLog, IActivityLog } from "../models/activity-log.model";
import { BaseRepository } from "./base.repository";

class ActivityLogRepository extends BaseRepository<IActivityLog> {
  constructor() {
    super(ActivityLog);
  }
}

export const activityLogRepository = new ActivityLogRepository();
