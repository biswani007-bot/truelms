import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string, assignmentId: string }> }) => {
  const { id, assignmentId } = await params;
  const { parent } = await getAuthenticatedParent(req);
  
  const assignments = await ParentService.getChildAssignments(parent._id, id);
  const assignment = assignments.find((a: any) => a.id.toString() === assignmentId);
  
  if (!assignment) {
    return NextResponse.json(ApiResponse.error("Assignment not found", "NOT_FOUND"), { status: 404 });
  }
  
  return NextResponse.json(ApiResponse.success("Assignment retrieved successfully", assignment));
});
