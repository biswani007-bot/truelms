import React from "react";
import { settingsRepository } from "../../../../repositories/settings.repository";
import SettingsForm from "../../../../components/SettingsForm";
import { connectDB } from "../../../../config/db";

export const metadata = {
  title: "Console Settings | TrueLern",
  description: "Configure organization settings, branding properties, password policies, and feature flags.",
};

export default async function SettingsPage() {
  await connectDB();
  let settings = await settingsRepository.getGlobalSettings();
  if (!settings) {
    // Seed default settings document if not created yet
    settings = await settingsRepository.updateGlobalSettings({});
  }

  // Parse to plain object for passing to client component
  const plainSettings = JSON.parse(JSON.stringify(settings));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure parameters that govern academic, batch, email, and authentication behaviors.</p>
      </div>

      <SettingsForm initialSettings={plainSettings} />
    </div>
  );
}
