import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

/**
 * GET /api/parent/status
 * Returns the parent's current onboarding/business journey state.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { parent } = await getAuthenticatedParent(req);
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") || undefined;
  const status = await ParentService.getParentStatus(parent._id, studentId);
  return NextResponse.json(ApiResponse.success("Parent status retrieved successfully", status));
});
