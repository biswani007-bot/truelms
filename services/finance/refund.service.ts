/* eslint-disable @typescript-eslint/no-explicit-any */
import { refundRepository } from "../../repositories/refund.repository";
import { TimelineService } from "./timeline.service";
import { Refund } from "../../models/refund.model";
import { FinanceApproval } from "../../models/finance-approval.model";

export class RefundService {
  static async requestRefund(invoiceId: string, paymentId: string, amount: number, reason: string, requestedByUserId: string) {
    const count = await refundRepository.findMany({}).then((res) => res.length);
    const refundNumber = `RFD-${String(count + 1).padStart(6, "0")}`;

    const refund = await Refund.create({
      refundNumber,
      invoice: invoiceId as any,
      payment: paymentId as any,
      reason,
      amount,
      refundDate: new Date(),
      status: "pending",
    });

    await FinanceApproval.create({
      referenceId: refund._id as any,
      status: "pending",
      requestedBy: requestedByUserId as any,
    });

    await TimelineService.logEvent(invoiceId, "refund-requested", `Refund of $${(amount / 100).toFixed(2)} requested for reason: ${reason}`, requestedByUserId);

    return refund;
  }
}
