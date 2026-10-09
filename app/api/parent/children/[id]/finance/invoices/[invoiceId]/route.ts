import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

/**
 * GET /api/parent/children/[id]/finance/invoices/[invoiceId]
 *
 * Secure parent-scoped invoice detail endpoint.
 * Strictly verifies:
 * 1. Authenticated Parent (HTTP-only session / JWT)
 * 2. Active ParentStudentLink with canAccessPortal === true
 * 3. invoice.student === child._id
 */
export const GET = apiHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string; invoiceId: string }> }
  ) => {
    const { id, invoiceId } = await params;
    const { parent } = await getAuthenticatedParent(req);
    const invoice = await ParentService.getChildInvoiceDetail(parent._id, id, invoiceId);
    return NextResponse.json(
      ApiResponse.success("Child invoice details retrieved successfully", invoice)
    );
  }
);
