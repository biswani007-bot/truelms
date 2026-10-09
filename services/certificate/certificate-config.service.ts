/* eslint-disable @typescript-eslint/no-explicit-any */
import { settingsRepository } from "../../repositories/settings.repository";
import { ActivityLog } from "../../models/activity-log.model";
import { connectDB } from "../../config/db";

export interface ICertificateEligibilityRules {
  attendanceThreshold: number;
  assignmentSubmissionThreshold: number;
  quizPassingThreshold: number;
  syllabusCompletionRequired: boolean;
}

export class CertificateEligibilityConfigService {
  /**
   * Intended Recommended Defaults for TrueLern:
   * - Live Attendance: 80% (standard academic threshold)
   * - Assignment Submission: 75% (established coursework benchmark)
   * - Quiz / Assessment Passing: 60% (TrueLern academic passing requirement)
   * - Syllabus Completion: Required (true)
   */
  public static readonly RECOMMENDED_DEFAULTS: ICertificateEligibilityRules = Object.freeze({
    attendanceThreshold: 80,
    assignmentSubmissionThreshold: 75,
    quizPassingThreshold: 60,
    syllabusCompletionRequired: true,
  });

  /**
   * Returns a copy of the TrueLern recommended defaults.
   */
  public static getDefaultRules(): ICertificateEligibilityRules {
    return { ...this.RECOMMENDED_DEFAULTS };
  }

  /**
   * Resolves the authoritative certificate eligibility rules from persisted settings.
   * Falls back to recommended defaults if settings are not yet configured.
   */
  public static async getEligibilityRules(): Promise<ICertificateEligibilityRules> {
    await connectDB();
    const settings = (await settingsRepository.getGlobalSettings()) || (await settingsRepository.findOne({}));

    const certConfig = (settings as any)?.certificate;

    const attendanceRaw = certConfig?.attendanceThreshold ?? (settings as any)?.academic?.attendanceRequirement;
    const assignmentRaw = certConfig?.assignmentSubmissionThreshold;
    const quizRaw = certConfig?.quizPassingThreshold ?? (settings as any)?.academic?.passingPercentage;
    const syllabusRaw = certConfig?.syllabusCompletionRequired;

    const attendanceThreshold =
      typeof attendanceRaw === "number" && !isNaN(attendanceRaw) && attendanceRaw >= 0 && attendanceRaw <= 100
        ? Math.round(attendanceRaw)
        : this.RECOMMENDED_DEFAULTS.attendanceThreshold;

    const assignmentSubmissionThreshold =
      typeof assignmentRaw === "number" && !isNaN(assignmentRaw) && assignmentRaw >= 0 && assignmentRaw <= 100
        ? Math.round(assignmentRaw)
        : this.RECOMMENDED_DEFAULTS.assignmentSubmissionThreshold;

    const quizPassingThreshold =
      typeof quizRaw === "number" && !isNaN(quizRaw) && quizRaw >= 0 && quizRaw <= 100
        ? Math.round(quizRaw)
        : this.RECOMMENDED_DEFAULTS.quizPassingThreshold;

    const syllabusCompletionRequired =
      typeof syllabusRaw === "boolean"
        ? syllabusRaw
        : this.RECOMMENDED_DEFAULTS.syllabusCompletionRequired;

    return {
      attendanceThreshold,
      assignmentSubmissionThreshold,
      quizPassingThreshold,
      syllabusCompletionRequired,
    };
  }

  /**
   * Authoritatively updates and persists the certificate eligibility rules.
   * Performs server-side boundary and type validation.
   */
  public static async updateEligibilityRules(
    input: Partial<ICertificateEligibilityRules>,
    updatedByUserId?: string
  ): Promise<ICertificateEligibilityRules> {
    await connectDB();

    const currentRules = await this.getEligibilityRules();

    // 1. Validate Attendance Threshold
    let attendanceThreshold = currentRules.attendanceThreshold;
    if (input.attendanceThreshold !== undefined) {
      const val = Number(input.attendanceThreshold);
      if (isNaN(val) || !Number.isFinite(val) || val < 0 || val > 100) {
        throw new Error("Attendance threshold must be a valid number between 0 and 100 percent.");
      }
      attendanceThreshold = Math.round(val);
    }

    // 2. Validate Assignment Submission Threshold
    let assignmentSubmissionThreshold = currentRules.assignmentSubmissionThreshold;
    if (input.assignmentSubmissionThreshold !== undefined) {
      const val = Number(input.assignmentSubmissionThreshold);
      if (isNaN(val) || !Number.isFinite(val) || val < 0 || val > 100) {
        throw new Error("Assignment submission threshold must be a valid number between 0 and 100 percent.");
      }
      assignmentSubmissionThreshold = Math.round(val);
    }

    // 3. Validate Quiz / Assessment Passing Threshold
    let quizPassingThreshold = currentRules.quizPassingThreshold;
    if (input.quizPassingThreshold !== undefined) {
      const val = Number(input.quizPassingThreshold);
      if (isNaN(val) || !Number.isFinite(val) || val < 0 || val > 100) {
        throw new Error("Quiz / assessment passing threshold must be a valid number between 0 and 100 percent.");
      }
      quizPassingThreshold = Math.round(val);
    }

    // 4. Validate Syllabus Completion
    let syllabusCompletionRequired = currentRules.syllabusCompletionRequired;
    if (input.syllabusCompletionRequired !== undefined) {
      if (typeof input.syllabusCompletionRequired !== "boolean") {
        throw new Error("Syllabus completion requirement must be a boolean (true or false).");
      }
      syllabusCompletionRequired = input.syllabusCompletionRequired;
    }

    const newRules: ICertificateEligibilityRules = {
      attendanceThreshold,
      assignmentSubmissionThreshold,
      quizPassingThreshold,
      syllabusCompletionRequired,
    };

    // 5. Persist to Settings model
    const settings = await settingsRepository.getGlobalSettings();
    if (!settings) {
      await settingsRepository.updateGlobalSettings({
        certificate: newRules,
      });
    } else {
      await settingsRepository.update((settings._id as any).toString(), {
        certificate: newRules,
      });
    }

    // 6. Audit Logging
    try {
      await ActivityLog.create({
        user: updatedByUserId || undefined,
        role: "Admin",
        action: "UPDATE",
        entity: "CertificateEligibilityRules",
        entityId: settings?._id?.toString() || "global",
        metadata: {
          message: "Certificate eligibility rules updated by administrator",
          previous: currentRules,
          updated: newRules,
        },
        timestamp: new Date(),
      });
    } catch {
      // Non-fatal if activity log creation fails in test environments
    }

    return newRules;
  }

  /**
   * Resets certificate eligibility rules back to the recommended TrueLern defaults.
   */
  public static async resetToDefaults(updatedByUserId?: string): Promise<ICertificateEligibilityRules> {
    return this.updateEligibilityRules(this.getDefaultRules(), updatedByUserId);
  }
}
