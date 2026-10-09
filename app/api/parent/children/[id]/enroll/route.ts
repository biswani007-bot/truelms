import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

/**
 * GET /api/parent/children/[id]/enroll
 * Retrieves authoritative conversion/enrollment offer for a child.
 * Includes child context, course context, completed demo, and fee breakdown.
 */
export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { parent } = await getAuthenticatedParent(req);
  const offer = await ParentService.getEnrollmentOffer(parent._id, id);
  return NextResponse.json(ApiResponse.success("Enrollment offer retrieved successfully", offer));
});

/**
 * POST /api/parent/children/[id]/enroll
 * Initiates authoritative enrollment for a child from completed demo or lead.
 * Creates or reuses waiting-payment Enrollment and authoritative Invoice.
 * Returns signed checkout token and checkoutUrl.
 */
export const POST = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { parent } = await getAuthenticatedParent(req);
  const body = await req.json().catch(() => ({}));
  const courseId = body.courseId;

  const result = await ParentService.initiateChildEnrollment(parent._id, id, courseId);
  return NextResponse.json(ApiResponse.success("Enrollment initiated successfully", result), { status: 201 });
});
