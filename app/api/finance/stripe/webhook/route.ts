import { NextRequest, NextResponse } from "next/server";
import { StripeService } from "../../../../../services/finance/stripe.service";
import { connectDB } from "../../../../../config/db";
import { logger } from "../../../../../utils/logger";

// Next.js config to disable body parsing for the raw webhook payload
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Raw body required for cryptographic Stripe signature validation
    const arrayBuffer = await req.arrayBuffer();
    const rawBody = Buffer.from(arrayBuffer);
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logger.warn("[StripeWebhookRoute] Missing stripe-signature header");
      return NextResponse.json({ error: "No signature found" }, { status: 400 });
    }

    await StripeService.handleWebhook(signature, rawBody);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    const errorMessage = error?.message || "Webhook processing failed";
    logger.error(`[StripeWebhookRoute] Error: ${errorMessage}`);

    // Signature verification or missing config errors should return 400 (terminal bad request)
    if (
      errorMessage.includes("signature") ||
      errorMessage.includes("Webhook Error") ||
      errorMessage.includes("Webhook secret missing")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Transient server/database failures must return 500 so Stripe automatically retries delivery
    return NextResponse.json({ error: "Internal processing error. Retryable." }, { status: 500 });
  }
}
