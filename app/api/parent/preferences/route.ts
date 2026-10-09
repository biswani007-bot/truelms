import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { PreferenceService } from "@/services/notification/preference.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

function serializePreference(pref: any) {
  const channelPreferences =
    pref.channelPreferences instanceof Map
      ? Object.fromEntries(pref.channelPreferences)
      : pref.channelPreferences || {};

  const eventPreferences =
    pref.eventPreferences instanceof Map
      ? Object.fromEntries(pref.eventPreferences)
      : pref.eventPreferences || {};

  return {
    id: pref._id?.toString(),
    channelPreferences,
    eventPreferences,
    muteAll: Boolean(pref.muteAll),
    digestEnabled: Boolean(pref.digestEnabled),
    language: pref.language || "en",
    timezone: pref.timezone || "UTC",
    updatedAt: pref.updatedAt,
  };
}

/**
 * GET /api/parent/preferences
 *
 * Retrieves the authenticated parent's communication and notification preferences.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { user } = await getAuthenticatedParent(req);
  const pref = await PreferenceService.getPreferences(user.userId);
  return NextResponse.json(
    ApiResponse.success("Parent preferences retrieved successfully", serializePreference(pref))
  );
});

/**
 * PATCH /api/parent/preferences
 *
 * Updates delivery channels, event categories, digest mode, and mute settings
 * for the authenticated parent.
 */
export const PATCH = apiHandler(async (req: NextRequest) => {
  const { user } = await getAuthenticatedParent(req);
  const body = await req.json();

  const updatePayload: any = {};
  if (body.channelPreferences && typeof body.channelPreferences === "object") {
    updatePayload.channelPreferences = body.channelPreferences;
  }
  if (body.eventPreferences && typeof body.eventPreferences === "object") {
    updatePayload.eventPreferences = body.eventPreferences;
  }
  if (typeof body.muteAll === "boolean") {
    updatePayload.muteAll = body.muteAll;
  }
  if (typeof body.digestEnabled === "boolean") {
    updatePayload.digestEnabled = body.digestEnabled;
  }
  if (typeof body.language === "string") {
    updatePayload.language = body.language.trim();
  }
  if (typeof body.timezone === "string") {
    updatePayload.timezone = body.timezone.trim();
  }

  const updated = await PreferenceService.updatePreferences(user.userId, updatePayload);
  return NextResponse.json(
    ApiResponse.success("Parent preferences updated successfully", serializePreference(updated))
  );
});
