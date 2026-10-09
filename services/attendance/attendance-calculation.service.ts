import { AttendanceRuleService } from "./attendance-rule.service";

export class AttendanceCalculationService {
  /**
   * Determine attendance status based on check-in time and durations
   */
  static async calculateStatus(
    batchId: string,
    classStart: Date,
    checkIn?: Date,
    durationAttended?: number,
    classDuration: number = 60
  ): Promise<"present" | "late" | "left-early" | "half-day" | "absent"> {
    if (!checkIn) return "absent";

    const lateThreshold = await AttendanceRuleService.getRuleValue(batchId, "lateThreshold");
    const gracePeriod = await AttendanceRuleService.getRuleValue(batchId, "gracePeriod");

    const diffMinutes = (checkIn.getTime() - classStart.getTime()) / (1000 * 60);

    // If check-in is beyond grace period + late threshold
    if (diffMinutes > lateThreshold + gracePeriod) {
      return "half-day";
    }

    if (diffMinutes > gracePeriod) {
      return "late";
    }

    if (durationAttended && durationAttended < classDuration * 0.5) {
      return "half-day";
    }

    if (durationAttended && durationAttended < classDuration * 0.8) {
      return "left-early";
    }

    return "present";
  }

  /**
   * Calculates current and longest streak from historical status arrays
   */
  static calculateStreaks(statuses: string[]): { currentStreak: number; longestStreak: number } {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Statuses sorted chronologically (oldest to newest)
    for (const status of statuses) {
      const isPresent = ["present", "late", "left-early"].includes(status);
      if (isPresent) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Current streak is calculated from the end of the array (most recent backward)
    for (let i = statuses.length - 1; i >= 0; i--) {
      const isPresent = ["present", "late", "left-early"].includes(statuses[i]);
      if (isPresent) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { currentStreak, longestStreak };
  }
}
