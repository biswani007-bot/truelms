/* eslint-disable @typescript-eslint/no-explicit-any */
import { paymentRepository } from "../../repositories/payment.repository";
import { invoiceRepository } from "../../repositories/invoice.repository";
import { TimelineService } from "./timeline.service";
import { ReceiptService } from "./receipt.service";
import { FinanceCalculationService } from "./finance-calculation.service";
import { Payment } from "../../models/payment.model";
import { BusinessEventService } from "../events/business-event.service";
import crypto from "crypto";
import { logger } from "../../utils/logger";

export class PaymentService {
  /**
   * Authoritative server-side payment recording.
   * Creates payment with status "success", updates invoice balances,
   * generates receipt, and publishes the canonical "Payment.completed" durable business event.
   */
  static async recordPayment(
    data: {
      invoiceId: string;
      amount: number;
      paymentMethod: "cash" | "bank-transfer" | "upi" | "credit-card" | "debit-card" | "cheque" | "online-gateway" | "wallet" | "custom";
      transactionReference?: string;
    },
    userId?: string
  ) {
    if (!data.amount || data.amount <= 0) {
      throw new Error("Invalid payment amount: must be greater than zero");
    }

    const invoice = await invoiceRepository.findById(data.invoiceId);
    if (!invoice) throw new Error("Invoice profile not found");

    if (["cancelled", "refunded"].includes(invoice.status)) {
      throw new Error(`Cannot pay an invoice with status: ${invoice.status}`);
    }

    const transactionReference =
      data.transactionReference || `TXN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Idempotency check: if transaction reference already exists, return existing payment immediately
    if (data.transactionReference) {
      const existingPayment = await Payment.findOne({ transactionReference: data.transactionReference });
      if (existingPayment) {
        logger.info(`[PaymentService] Idempotency match: Payment already exists for TXN ${data.transactionReference}`);
        return existingPayment;
      }
    }

    if (invoice.status === "paid" && invoice.outstandingAmount <= 0) {
      throw new Error("Invoice is already fully paid");
    }

    if (data.amount > invoice.outstandingAmount) {
      throw new Error(
        `Overpayment rejected: payment amount ${data.amount} exceeds invoice outstanding amount ${invoice.outstandingAmount}`
      );
    }

    const count = await paymentRepository.findMany({}).then((res) => res.length);
    const paymentNumber = `PMT-${String(count + 1).padStart(6, "0")}`;
    const currency = (invoice as any).currency || "USD";

    // 1. Create Payment record with status success
    let payment;
    try {
      payment = await Payment.create({
        paymentNumber,
        invoice: data.invoiceId as any,
        student: invoice.student,
        amount: data.amount,
        paymentDate: new Date(),
        currency,
        transactionReference,
        paymentMethod: data.paymentMethod,
        status: "success",
      });
    } catch (err: any) {
      if (err.code === 11000) {
        logger.info(`[PaymentService] Idempotency match (E11000): Payment concurrently created for TXN ${transactionReference}`);
        const existingPayment = await Payment.findOne({ transactionReference });
        if (existingPayment) return existingPayment;
      }
      throw err;
    }

    // 2. Update Outstanding Balances on Invoice
    const nextOutstanding = FinanceCalculationService.subtract(invoice.outstandingAmount, data.amount);
    const status = nextOutstanding <= 0 ? "paid" : "partially-paid";

    await invoiceRepository.update(data.invoiceId, {
      outstandingAmount: Math.max(0, nextOutstanding),
      status,
    });

    await TimelineService.logEvent(
      data.invoiceId,
      "payment-recorded",
      `Payment of $${(data.amount / 100).toFixed(2)} recorded successfully via ${data.paymentMethod}`,
      userId
    );

    // 3. Automate Receipt Issuance (idempotent)
    await ReceiptService.issueReceipt(data.invoiceId, payment._id.toString(), data.amount, 0, userId);

    if (nextOutstanding <= 0) {
      await TimelineService.logEvent(data.invoiceId, "invoice-closed", `Invoice fully settled and closed`, userId);
    }

    // 4. Publish canonical Payment.completed durable business event
    try {
      await BusinessEventService.publishEvent({
        eventType: "Payment.completed",
        entityType: "Payment",
        entityId: payment._id.toString(),
        payload: {
          paymentId: payment._id.toString(),
          invoiceId: data.invoiceId,
          enrollmentId: invoice.enrollment?.toString(),
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionReference,
        },
        idempotencyKey: `payment-completed-${payment._id}`,
      });
      logger.info(`[PaymentService] Published canonical Payment.completed event for payment ${payment.paymentNumber}`);
    } catch (err: any) {
      logger.error(`[PaymentService] Failed to publish Payment.completed event: ${err.message}`);
    }

    // 5. Direct execution of post-payment automation chain for immediate completion
    try {
      const { PaymentAutomationService } = await import("../automation/payment-automation.service");
      await PaymentAutomationService.handlePaymentCompleted(payment._id.toString());
    } catch (autoErr: any) {
      logger.warn(`[PaymentService] Direct post-payment automation notice: ${autoErr.message}`);
    }

    return payment;
  }
}
