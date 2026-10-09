/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { settingsRepository } from "../../repositories/settings.repository";
import { invoiceRepository } from "../../repositories/invoice.repository";
import { PaymentService } from "./payment.service";
import { Payment } from "../../models/payment.model";
import { Receipt } from "../../models/receipt.model";
import { Enrollment } from "../../models/enrollment.model";
import { logger } from "../../utils/logger";
import { CurrencyUtil } from "../../utils/currency.util";

export class StripeService {
  /**
   * Initialize Stripe client from database settings or environment dynamically.
   * Validates mode safety (preventing test keys in live mode and live keys in test mode).
   */
  public static async getStripeClient(): Promise<{ stripe: Stripe; endpointSecret?: string; mode: string }> {
    const settings = await settingsRepository.getGlobalSettings();
    const gateways = settings?.payment?.gateways || [];
    const stripeConfig = gateways.find((g: any) => g.provider === "stripe" && g.enabled);

    let secretKey = stripeConfig?.secretKey;
    if (!secretKey && process.env.STRIPE_SECRET_KEY) {
      secretKey = process.env.STRIPE_SECRET_KEY;
    }

    if (!secretKey) {
      throw new Error("Stripe payment gateway is not configured or is disabled.");
    }

    const mode = (stripeConfig?.mode || settings?.payment?.mode || "test").toLowerCase();

    // Mode safety checks (Phase 13 & 14)
    if (mode === "test" && secretKey.startsWith("sk_live_")) {
      throw new Error("Configuration Error: Live secret key detected while system is in TEST mode.");
    }
    if (mode === "live" && secretKey.startsWith("sk_test_")) {
      throw new Error("Configuration Error: Test secret key detected while system is in LIVE mode.");
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any,
    });

    const endpointSecret = (stripeConfig as any)?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

    return { stripe, endpointSecret, mode };
  }

  /**
   * Create a server-authoritative Stripe Checkout Session for an invoice.
   */
  static async createCheckoutSession(
    invoiceId: string,
    studentId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const { stripe } = await this.getStripeClient();

    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    if (invoice.student.toString() !== studentId) {
      throw new Error("Unauthorized access to invoice");
    }

    if (["paid", "cancelled", "refunded"].includes(invoice.status)) {
      throw new Error(`Cannot pay an invoice with status: ${invoice.status}`);
    }

    if (invoice.outstandingAmount <= 0) {
      throw new Error("Invoice is already fully paid.");
    }

    // Server-Authoritative amount & currency
    const amountCents = invoice.outstandingAmount;
    const settings = await settingsRepository.getGlobalSettings();
    const currency = ((invoice as any).currency || settings?.payment?.currency || "usd").toLowerCase();

    // Construct metadata strictly from server database truth
    const metadata: Record<string, string> = {
      invoiceId: invoice._id.toString(),
      studentId: invoice.student.toString(),
      courseId: invoice.course ? invoice.course.toString() : "",
      enrollmentId: invoice.enrollment ? invoice.enrollment.toString() : "",
    };

    // Create session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Invoice #${invoice.invoiceNumber}`,
              description: "Tuition and academic program fee payment",
            },
            unit_amount: CurrencyUtil.toStripeMinorUnits(amountCents, currency),
          },
          quantity: 1,
        },
      ],
      client_reference_id: invoiceId,
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Handle Stripe Webhook Event with signature verification, duplicate replay protection,
   * and comprehensive event coverage.
   */
  static async handleWebhook(signature: string, rawBody: Buffer) {
    const { stripe, endpointSecret } = await this.getStripeClient();

    if (!endpointSecret) {
      logger.warn("Stripe webhook secret not configured. Cannot verify webhook signature.");
      throw new Error("Webhook secret missing");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err: any) {
      logger.error(`Stripe webhook signature verification failed: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    logger.info(`[StripeWebhook] Received verified event: ${event.type} (${event.id})`);

    // Handle supported lifecycle events (Phase 9)
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await this.processSuccessfulPayment(session);
        } else {
          logger.info(`[StripeWebhook] Session ${session.id} completed with payment_status: ${session.payment_status}`);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.processSuccessfulPayment(session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.warn(`[StripeWebhook] Async payment failed for session ${session.id}, invoice: ${session.metadata?.invoiceId}`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info(`[StripeWebhook] Checkout session ${session.id} expired. Invoice remains open.`);
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const failureMessage = intent.last_payment_error?.message || "Payment attempt failed";
        logger.warn(`[StripeWebhook] PaymentIntent ${intent.id} failed: ${failureMessage}`);
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        logger.info(`[StripeWebhook] PaymentIntent ${intent.id} succeeded for amount ${intent.amount}`);
        break;
      }

      default:
        logger.info(`[StripeWebhook] Safely ignored unhandled Stripe event type: ${event.type}`);
    }

    return { success: true };
  }

  /**
   * Authoritatively process a verified successful checkout payment.
   */
  private static async processSuccessfulPayment(session: Stripe.Checkout.Session) {
    const invoiceId = session.metadata?.invoiceId;
    if (!invoiceId) {
      logger.error(`Stripe session ${session.id} missing invoiceId in metadata`);
      return;
    }

    const transactionReference = (session.payment_intent as string) || session.id;

    // Idempotency check: if transaction reference already exists in TrueLern, return immediately without re-crediting
    const existingPayment = await Payment.findOne({ transactionReference });
    if (existingPayment) {
      logger.info(
        `[StripeWebhook] Idempotent replay: Payment already recorded for TXN ${transactionReference} (invoice ${invoiceId})`
      );
      return;
    }

    const amountPaidStripe = session.amount_total;
    if (typeof amountPaidStripe !== "number") {
      logger.error(`[StripeWebhook] Session ${session.id} missing amount_total`);
      return;
    }

    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      logger.error(`[StripeWebhook] Invoice ${invoiceId} not found for session ${session.id}`);
      return;
    }

    const currency = session.currency || "usd";
    const amountPaid = CurrencyUtil.fromStripeMinorUnits(amountPaidStripe, currency);

    // Overpayment protection
    if (amountPaid > invoice.outstandingAmount) {
      logger.error(
        `[StripeWebhook] Overpayment rejected: Paid ${amountPaid}, outstanding ${invoice.outstandingAmount} for invoice ${invoiceId}`
      );
      return;
    }

    // Already-paid invoice check
    if (invoice.status === "paid" && invoice.outstandingAmount <= 0) {
      logger.warn(`[StripeWebhook] Invoice ${invoiceId} is already paid. Skipping double charge credit.`);
      return;
    }

    try {
      await PaymentService.recordPayment({
        invoiceId,
        amount: amountPaid,
        paymentMethod: "online-gateway",
        transactionReference,
      });
      logger.info(`[StripeWebhook] Successfully processed verified Stripe payment for invoice ${invoiceId}`);
    } catch (err: any) {
      logger.error(`[StripeWebhook] Failed to process Stripe payment for invoice ${invoiceId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Harmless admin-only payment configuration health check (Phase 15).
   * Verifies Stripe configuration without revealing secret key contents.
   */
  static async getHealthStatus() {
    const settings = await settingsRepository.getGlobalSettings();
    const gateways = settings?.payment?.gateways || [];
    const stripeConfig = gateways.find((g: any) => g.provider === "stripe");

    let secretKey = stripeConfig?.secretKey;
    if (!secretKey && process.env.STRIPE_SECRET_KEY) {
      secretKey = process.env.STRIPE_SECRET_KEY;
    }

    const webhookSecret = (stripeConfig as any)?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    const mode = (stripeConfig?.mode || settings?.payment?.mode || "test").toLowerCase();
    const enabled = Boolean(stripeConfig?.enabled);
    const currency = (settings?.payment?.currency || "USD").toUpperCase();

    const issues: string[] = [];

    if (!secretKey) {
      issues.push("Stripe secret key is missing");
    } else {
      if (mode === "test" && !secretKey.startsWith("sk_test_")) {
        issues.push("System is in TEST mode but Stripe secret key does not start with sk_test_");
      }
      if (mode === "live" && !secretKey.startsWith("sk_live_")) {
        issues.push("System is in LIVE mode but Stripe secret key does not start with sk_live_");
      }
    }

    if (!webhookSecret) {
      issues.push("Stripe webhook secret is missing");
    }

    let keyType: "test" | "live" | "none" = "none";
    if (secretKey?.startsWith("sk_test_")) keyType = "test";
    else if (secretKey?.startsWith("sk_live_")) keyType = "live";

    const isHealthy = issues.length === 0 && enabled;

    return {
      provider: "stripe",
      configured: Boolean(secretKey),
      enabled,
      mode,
      secretKeyPresent: Boolean(secretKey),
      secretKeyType: keyType,
      webhookSecretPresent: Boolean(webhookSecret),
      currency,
      status: isHealthy ? "healthy" : issues.length > 0 ? "misconfigured" : "disabled",
      issues,
    };
  }

  /**
   * Admin-only read-only reconciliation tool (Phase 47).
   * Compares Stripe transaction/session truth against TrueLern database records.
   */
  static async reconcilePayment(params: {
    transactionReference?: string;
    sessionId?: string;
    invoiceId?: string;
  }) {
    const { transactionReference, sessionId, invoiceId } = params;

    let stripeSession: any = null;
    let stripeIntent: any = null;

    if (sessionId || transactionReference) {
      try {
        const { stripe } = await this.getStripeClient();
        if (sessionId) {
          stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
        }
        if (transactionReference && transactionReference.startsWith("pi_")) {
          stripeIntent = await stripe.paymentIntents.retrieve(transactionReference);
        }
      } catch (err: any) {
        logger.warn(`[StripeReconciliation] Stripe retrieval note: ${err.message}`);
      }
    }

    const resolvedInvoiceId =
      invoiceId || stripeSession?.metadata?.invoiceId || stripeSession?.client_reference_id;

    const invoice = resolvedInvoiceId ? await invoiceRepository.findById(resolvedInvoiceId) : null;
    const payment = transactionReference
      ? await Payment.findOne({ transactionReference })
      : resolvedInvoiceId
      ? await Payment.findOne({ invoice: resolvedInvoiceId }).sort({ createdAt: -1 })
      : null;

    const receipt = payment ? await Receipt.findOne({ payment: payment._id }) : null;
    const enrollment = invoice?.enrollment
      ? await Enrollment.findById(invoice.enrollment)
      : invoice?.student
      ? await Enrollment.findOne({ student: invoice.student, course: invoice.course })
      : null;

    const discrepancies: string[] = [];

    if (!invoice) discrepancies.push("Invoice not found in database");
    if (!payment) discrepancies.push("Payment record not found in database");
    if (payment && !receipt) discrepancies.push("Receipt voucher missing for payment");
    if (payment && !enrollment) discrepancies.push("Enrollment record missing for student");

    if (payment && invoice) {
      if (invoice.outstandingAmount > 0 && invoice.status === "paid") {
        discrepancies.push("Invoice marked paid but has outstanding balance");
      }
    }

    return {
      reconciled: discrepancies.length === 0,
      discrepancies,
      stripe: {
        sessionId: stripeSession?.id || null,
        paymentStatus: stripeSession?.payment_status || stripeIntent?.status || null,
        amountTotal: stripeSession?.amount_total || stripeIntent?.amount || null,
        currency: stripeSession?.currency || stripeIntent?.currency || null,
      },
      database: {
        invoice: invoice
          ? {
              id: invoice._id,
              invoiceNumber: invoice.invoiceNumber,
              totalAmount: invoice.totalAmount,
              outstandingAmount: invoice.outstandingAmount,
              status: invoice.status,
            }
          : null,
        payment: payment
          ? {
              id: payment._id,
              paymentNumber: payment.paymentNumber,
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
              transactionReference: payment.transactionReference,
            }
          : null,
        receipt: receipt
          ? {
              id: receipt._id,
              receiptNumber: receipt.receiptNumber,
              amount: receipt.amount,
            }
          : null,
        enrollment: enrollment
          ? {
              id: enrollment._id,
              enrollmentNumber: enrollment.enrollmentNumber,
              status: enrollment.status,
            }
          : null,
      },
    };
  }
}
