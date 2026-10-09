import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { apiHandler } from "@/utils/api-handler";

/**
 * GET /api/parent/children/[id]/finance/receipts/[receiptId]/download
 *
 * Downloads binary PDF receipt voucher for authorized child.
 * Strictly verifies Parent authorization and ownership.
 */
export const GET = apiHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string; receiptId: string }> }
  ) => {
    const { id, receiptId } = await params;
    const { parent } = await getAuthenticatedParent(req);
    const { buffer, fileName } = await ParentService.generateReceiptPdf(
      parent._id,
      id,
      receiptId
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  }
);
