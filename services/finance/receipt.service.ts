/* eslint-disable @typescript-eslint/no-explicit-any */
import { receiptRepository } from "../../repositories/receipt.repository";
import { TimelineService } from "./timeline.service";
import { Receipt } from "../../models/receipt.model";
import { Invoice } from "../../models/invoice.model";

export class ReceiptService {
  static async issueReceipt(invoiceId: string, paymentId: string, amount: number, taxes: number, userId?: string) {
    // Idempotency: return existing receipt if already issued for this payment
    const existingReceipt = await Receipt.findOne({ payment: paymentId });
    if (existingReceipt) {
      return existingReceipt;
    }

    const invoice = await Invoice.findById(invoiceId);
    const count = await receiptRepository.findMany({}).then((res) => res.length);
    const receiptNumber = `RCP-${String(count + 1).padStart(6, "0")}`;

    const receipt = await receiptRepository.create({
      receiptNumber,
      invoice: invoiceId as any,
      payment: paymentId as any,
      student: invoice?.student as any,
      enrollment: invoice?.enrollment as any,
      amount,
      taxes,
      issueDate: new Date(),
    });

    await TimelineService.logEvent(invoiceId, "receipt-issued", `Receipt ${receiptNumber} generated for amount of $${(amount / 100).toFixed(2)}`, userId);
    return receipt;
  }
}
