import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

/**
 * GET /api/parent/children/[id]/finance/receipts/[receiptId]
 *
 * Secure parent-scoped receipt voucher detail endpoint.
 * Strictly verifies:
 * 1. Authenticated Parent (HTTP-only session / JWT)
 * 2. Active ParentStudentLink with canAccessPortal === true
 * 3. receipt.invoice.student === child._id
 */
export const GET = apiHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string; receiptId: string }> }
  ) => {
    const { id, receiptId } = await params;
    const { parent } = await getAuthenticatedParent(req);
    const receipt = await ParentService.getChildReceiptDetail(parent._id, id, receiptId);
    return NextResponse.json(
      ApiResponse.success("Child payment receipt voucher retrieved successfully", receipt)
    );
  }
);
