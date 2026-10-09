import { NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { StripeService } from "../../../../../services/finance/stripe.service";
import { connectDB } from "../../../../../config/db";

/**
 * GET /api/admin/finance/health
 *
 * Administrative diagnostic endpoint to verify Stripe payment gateway configuration
 * health, environment mode alignment, and webhook readiness without exposing secrets.
 */
export const GET = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async () => {
    await connectDB();
    const health = await StripeService.getHealthStatus();

    return NextResponse.json(
      ResponseHelper.success("Payment configuration health check completed", health),
      { status: 200 }
    );
  })
);
