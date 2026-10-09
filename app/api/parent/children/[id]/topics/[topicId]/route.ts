import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string, topicId: string }> }) => {
  const { id, topicId } = await params;
  const { parent } = await getAuthenticatedParent(req);
  // Verify enrollment program
  const program = await ParentService.getChildProgram(parent._id, id);
  if (!program) throw new Error("Not enrolled");
  
  return NextResponse.json(ApiResponse.success("Topic retrieved successfully", { topicId, programId: program.programId }));
});
