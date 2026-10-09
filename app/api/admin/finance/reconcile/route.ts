import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { StripeService } from "../../../../../services/finance/stripe.service";
import { connectDB } from "../../../../../config/db";

/**
 * GET /api/admin/finance/reconcile?invoiceId=...&transactionReference=...&sessionId=...
 *
 * Administrative read-only reconciliation endpoint.
 * Compares Stripe gateway truth vs TrueLern database truth across:
 * Stripe Session/PaymentIntent <-> Payment <-> Invoice <-> Receipt <-> Enrollment
 */
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId") || undefined;
    const transactionReference = searchParams.get("transactionReference") || undefined;
    const sessionId = searchParams.get("sessionId") || undefined;

    if (!invoiceId && !transactionReference && !sessionId) {
      return NextResponse.json(
        ResponseHelper.error("At least one identifier (invoiceId, transactionReference, or sessionId) is required"),
        { status: 400 }
      );
    }

    const report = await StripeService.reconcilePayment({
      invoiceId,
      transactionReference,
      sessionId,
    });

    return NextResponse.json(
      ResponseHelper.success("Payment reconciliation completed", report),
      { status: 200 }
    );
  })
);
