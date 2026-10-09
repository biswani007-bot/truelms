import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

/**
 * POST /api/parent/children/[id]/finance/pay
 *
 * Authoritatively processes customer-initiated payment on an invoice for an authorized child ward.
 * Validates:
 * 1. Authenticated Parent (HTTP-only session/JWT)
 * 2. Active ParentStudentLink with canAccessPortal === true
 * 3. Invoice belongs strictly to the selected child
 * 4. Records payment with PaymentService.recordPayment
 * 5. Transitions Enrollment from waiting-payment -> confirmed
 */
export const POST = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { parent, user } = await getAuthenticatedParent(req);
  const body = await req.json();

  const { invoiceId, amount, paymentMethod } = body ?? {};

  if (!invoiceId) {
    return NextResponse.json(ApiResponse.error("invoiceId is required", "VALIDATION_ERROR"), { status: 400 });
  }

  const result = await ParentService.payChildInvoice(
    parent._id,
    id,
    {
      invoiceId,
      amount,
      paymentMethod,
    },
    user.userId
  );

  return NextResponse.json(ApiResponse.success("Payment recorded successfully", result), { status: 201 });
});
