/* eslint-disable @typescript-eslint/no-explicit-any */
import { notificationPreferenceRepository } from "../../repositories/notification-preference.repository";
import { NotificationPreference } from "../../models/notification-preference.model";

export class PreferenceService {
  static async getPreferences(userId: string) {
    let pref = await notificationPreferenceRepository.findOne({ user: userId });
    if (!pref) {
      // Lazy init preference record for user
      pref = await NotificationPreference.create({
        user: userId as any,
        channelPreferences: { email: true, sms: true, whatsapp: true, push: true, "in-app": true },
        eventPreferences: {
          admissions: true,
          enrollment: true,
          attendance: true,
          assignment: true,
          assessment: true,
          certificate: true,
          finance: true,
          reports: true,
        },
        muteAll: false,
        digestEnabled: false,
        language: "en",
        timezone: "UTC",
      });
    }
    return pref;
  }

  static async updatePreferences(userId: string, data: Partial<{
    channelPreferences: Record<string, boolean>;
    eventPreferences: Record<string, boolean>;
    muteAll: boolean;
    digestEnabled: boolean;
    language: string;
    timezone: string;
  }>) {
    const pref = await PreferenceService.getPreferences(userId);
    if (!pref) throw new Error("Could not resolve preferences for user");
    return notificationPreferenceRepository.update(pref._id.toString(), data as any);
  }
}
