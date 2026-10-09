import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

/**
 * GET /api/parent/demo
 * Returns the parent's active scheduled or completed demo.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { parent } = await getAuthenticatedParent(req);
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId") || undefined;
  const demo = await ParentService.getParentDemo(parent._id, studentId);
  
  if (!demo) {
    return NextResponse.json(ApiResponse.success("No active demo found", null));
  }
  
  return NextResponse.json(ApiResponse.success("Parent demo retrieved successfully", demo));
});

/**
 * POST /api/parent/demo
 * Creates or updates a scheduled DemoSession for the authenticated Parent and selected child.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const { parent } = await getAuthenticatedParent(req);
  const body = await req.json();
  const { studentId, courseId, programInterest, preferredTime, preferredDate, notes, slotId } = body ?? {};

  if (!studentId || typeof studentId !== "string") {
    return NextResponse.json(ApiResponse.error("Student ID is required", "VALIDATION_ERROR"), { status: 400 });
  }

  const demo = await ParentService.scheduleParentDemo(
    parent._id,
    studentId as any,
    {
      courseId,
      programInterest,
      preferredTime,
      preferredDate,
      notes,
      slotId,
    }
  );

  return NextResponse.json(ApiResponse.success("Demo scheduled successfully", demo), { status: 201 });
});

