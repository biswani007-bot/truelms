/* eslint-disable @typescript-eslint/no-explicit-any */
import { Settings, ISettings } from "../models/settings.model";
import { BaseRepository } from "./base.repository";

export class SettingsRepository extends BaseRepository<ISettings> {
  constructor() {
    super(Settings);
  }

  async getGlobalSettings(): Promise<ISettings | null> {
    return this.findOne({ key: "global" });
  }

  async updateGlobalSettings(data: Partial<ISettings>): Promise<ISettings | null> {
    const settings = await this.getGlobalSettings();
    if (!settings) {
      // Create if not exists
      return this.create({ key: "global", ...data } as any);
    }
    return this.update((settings._id as any).toString(), data);
  }
}

export const settingsRepository = new SettingsRepository();
