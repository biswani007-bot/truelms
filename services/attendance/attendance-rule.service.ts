/* eslint-disable @typescript-eslint/no-explicit-any */
import { settingsRepository } from "../../repositories/settings.repository";
import { attendanceRuleRepository } from "../../repositories/attendance-rule.repository";

export class AttendanceRuleService {
  /**
   * Retrieves rule values from platform settings, merging with batch overrides if exists
   */
  static async getRuleValue(
    batchId: string,
    ruleKey: "minimumAttendancePercent" | "certificateEligibilityPercent" | "assessmentEligibilityPercent" | "lateThreshold" | "gracePeriod"
  ): Promise<number> {
    // 1. Check batch overrides
    const override = await attendanceRuleRepository.findOne({
      batch: batchId as any,
      ruleKey,
      isEnabled: true,
    });
    if (override && override.isOverride) {
      return override.value;
    }

    // 2. Load platform settings values
    const settings = await settingsRepository.findOne({ key: "global" });
    if (!settings) return this.getDefaultFallback(ruleKey);

    switch (ruleKey) {
      case "minimumAttendancePercent":
        return settings.academic?.attendanceRequirement ?? 75;
      case "certificateEligibilityPercent":
        return settings.academic?.attendanceRequirement ?? 75;
      case "assessmentEligibilityPercent":
        return 75; // standard academic rule
      case "lateThreshold":
        return 15; // default 15 minutes
      case "gracePeriod":
        return 10; // default 10 minutes
      default:
        return this.getDefaultFallback(ruleKey);
    }
  }

  private static getDefaultFallback(ruleKey: string): number {
    const fallbacks: Record<string, number> = {
      minimumAttendancePercent: 75,
      certificateEligibilityPercent: 75,
      assessmentEligibilityPercent: 75,
      lateThreshold: 15,
      gracePeriod: 10,
    };
    return fallbacks[ruleKey] ?? 0;
  }
}
