/* eslint-disable @typescript-eslint/no-explicit-any */
import { paymentInstallmentRepository } from "../../repositories/payment-installment.repository";
import { invoiceRepository } from "../../repositories/invoice.repository";
import { PaymentInstallment, IPaymentInstallment } from "../../models/payment-installment.model";
import { FinanceCalculationService } from "./finance-calculation.service";

export interface InstallmentScheduleInput {
  installmentNumber: number;
  dueDate: Date;
  amount: number; // in cents
  notes?: string;
}

export class InstallmentService {
  /**
   * Generate installment schedule records for an invoice.
   * Admin manually defines the schedule via API.
   */
  static async generateInstallments(invoiceId: string, schedules: InstallmentScheduleInput[]) {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    // Validate total installment amount doesn't exceed invoice total
    const total = schedules.reduce((sum, s) => FinanceCalculationService.add(sum, s.amount), 0);
    if (total > invoice.totalAmount) {
      throw new Error(`Installment total (${total}) exceeds invoice total (${invoice.totalAmount})`);
    }

    const created = [];
    for (const schedule of schedules) {
      const inst = await PaymentInstallment.create({
        invoice: invoiceId as any,
        installmentNumber: schedule.installmentNumber,
        dueDate: schedule.dueDate,
        amount: schedule.amount,
        paidAmount: 0,
        status: "pending",
        notes: schedule.notes,
      });
      created.push(inst);
    }

    return created;
  }

  /**
   * Mark an installment as paid (partial or full).
   */
  static async markPaid(installmentId: string, paidAmount: number) {
    const inst = await paymentInstallmentRepository.findById(installmentId);
    if (!inst) throw new Error("Installment not found");

    const newPaid = FinanceCalculationService.add(inst.paidAmount, paidAmount);
    const status = newPaid >= inst.amount ? "paid" : "pending";

    return paymentInstallmentRepository.update(installmentId, {
      paidAmount: newPaid,
      status,
    } as any);
  }

  /**
   * Returns all overdue installments (past due date, not paid).
   */
  static async getOverdue(): Promise<IPaymentInstallment[]> {
    return PaymentInstallment.find({
      status: "pending",
      dueDate: { $lt: new Date() },
      isDeleted: false,
    }).lean<IPaymentInstallment[]>();
  }

  /**
   * Returns installments for a specific invoice.
   */
  static async getByInvoice(invoiceId: string) {
    return paymentInstallmentRepository.findMany(
      { invoice: invoiceId as any },
    );
  }
}
