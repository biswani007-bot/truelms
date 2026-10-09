import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string, classId: string }> }) => {
  const { id, classId } = await params;
  const { parent } = await getAuthenticatedParent(req);
  const data = await ParentService.getChildClassSummary(parent._id, id, classId);
  return NextResponse.json(ApiResponse.success("Class summary retrieved successfully", data));
});
