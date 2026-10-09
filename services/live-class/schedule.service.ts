import { ILiveClassSchedule } from "../../models/live-class-schedule.model";

export class ScheduleService {
  /**
   * Generates start dates for recurring classes within a range
   */
  static generateDates(schedule: ILiveClassSchedule): Date[] {
    const dates: Date[] = [];
    const rule = schedule.recurrenceRule;
    const config = schedule.recurrenceConfig;
    const startRange = new Date(schedule.startRange);
    const endRange = new Date(schedule.endRange);

    if (rule === "one-time") {
      dates.push(startRange);
      return dates;
    }

    if (rule === "custom" && config?.dates) {
      return config.dates.map((d) => new Date(d));
    }

    const current = new Date(startRange);
    const interval = config?.interval || 1;

    while (current <= endRange) {
      if (rule === "daily") {
        dates.push(new Date(current));
        current.setDate(current.getDate() + interval);
      } else if (rule === "weekly" && config?.daysOfWeek) {
        // daysOfWeek: Array of numbers 0=Sun, 1=Mon...
        if (config.daysOfWeek.includes(current.getDay())) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      } else if (rule === "monthly") {
        dates.push(new Date(current));
        current.setMonth(current.getMonth() + interval);
      } else {
        // Fallback to prevent infinite loops
        current.setDate(current.getDate() + 1);
      }
    }

    return dates;
  }
}
