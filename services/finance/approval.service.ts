/* eslint-disable @typescript-eslint/no-explicit-any */
import { invoiceRepository } from "../../repositories/invoice.repository";
import { TimelineService } from "./timeline.service";
import { Refund } from "../../models/refund.model";
import { FinanceApproval } from "../../models/finance-approval.model";
import { FinanceCalculationService } from "./finance-calculation.service";

export class ApprovalService {
  static async approve(refundId: string, reviewerId: string, remarks?: string) {
    const approval = await FinanceApproval.findOneAndUpdate(
      { referenceId: refundId as any },
      {
        $set: {
          status: "approved",
          remarks,
          approvedBy: reviewerId as any,
          actionedAt: new Date(),
        },
      },
      { new: true }
    );

    const refund = await Refund.findByIdAndUpdate(refundId, { status: "approved", approvedBy: reviewerId as any });
    if (!refund) throw new Error("Refund record not found");

    // Add refund value back to invoice outstanding or adjust status
    const invoice = await invoiceRepository.findById(refund.invoice.toString());
    if (invoice) {
      const nextOutstanding = FinanceCalculationService.add(invoice.outstandingAmount, refund.amount);
      await invoiceRepository.update(refund.invoice.toString(), {
        outstandingAmount: nextOutstanding,
        status: "refunded",
      });
    }

    await TimelineService.logEvent(refund.invoice.toString(), "refund-approved", "Refund request approved by Chief Financial Officer", reviewerId);

    return approval;
  }

  static async reject(refundId: string, reviewerId: string, remarks: string) {
    const approval = await FinanceApproval.findOneAndUpdate(
      { referenceId: refundId as any },
      {
        $set: {
          status: "rejected",
          remarks,
          approvedBy: reviewerId as any,
          actionedAt: new Date(),
        },
      },
      { new: true }
    );

    await Refund.findByIdAndUpdate(refundId, { status: "rejected" });

    return approval;
  }
}
