import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

/**
 * GET /api/parent/profile
 *
 * Retrieves the authenticated parent's full profile, account security details,
 * and list of linked student wards.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { user } = await getAuthenticatedParent(req);
  const profileData = await ParentService.getParentProfile(user.userId);
  return NextResponse.json(
    ApiResponse.success("Parent profile retrieved successfully", profileData)
  );
});

/**
 * PATCH /api/parent/profile
 *
 * Persists verified updates to the authenticated parent's profile and contact details.
 */
export const PATCH = apiHandler(async (req: NextRequest) => {
  const { user } = await getAuthenticatedParent(req);
  const body = await req.json();
  const updatedProfile = await ParentService.updateParentProfile(user.userId, body);
  return NextResponse.json(
    ApiResponse.success("Parent profile updated successfully", updatedProfile)
  );
});

export const PUT = PATCH;
