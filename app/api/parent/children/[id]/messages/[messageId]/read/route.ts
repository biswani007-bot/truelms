import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const PATCH = apiHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string; messageId: string }> }
  ) => {
    const { id, messageId } = await params;
    const { parent } = await getAuthenticatedParent(req);

    const result = await ParentService.markChildMessageRead(parent._id, id, messageId);
    return NextResponse.json(ApiResponse.success("Message marked as read", result));
  }
);
