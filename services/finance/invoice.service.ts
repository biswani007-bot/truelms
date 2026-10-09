/* eslint-disable @typescript-eslint/no-explicit-any */
import { invoiceRepository } from "../../repositories/invoice.repository";
import { enrollmentRepository } from "../../repositories/enrollment.repository";
import { feePlanRepository } from "../../repositories/fee-plan.repository";
import { TimelineService } from "./timeline.service";
import { FinanceCalculationService } from "./finance-calculation.service";
import { Invoice } from "../../models/invoice.model";

export class InvoiceService {
  static async generateInvoice(enrollmentId: string, feePlanId: string, discountAmount: number = 0, scholarshipAmount: number = 0, userId?: string) {
    const enrollment = await enrollmentRepository.findById(enrollmentId);
    if (!enrollment) throw new Error("Enrollment profile not found");

    const plan = await feePlanRepository.findById(feePlanId);
    if (!plan) throw new Error("Fee plan not found");

    const count = await invoiceRepository.findMany({}).then((res) => res.length);
    const invoiceNumber = `INV-${String(count + 1).padStart(6, "0")}`;

    const baseAmount = FinanceCalculationService.add(plan.baseFee, plan.registrationFee);
    let gross = FinanceCalculationService.add(baseAmount, plan.materialFee);
    gross = FinanceCalculationService.add(gross, plan.labFee);
    gross = FinanceCalculationService.add(gross, plan.examFee);
    const subTotal = FinanceCalculationService.subtract(gross, FinanceCalculationService.add(discountAmount, scholarshipAmount));
    const taxAmount = FinanceCalculationService.multiply(subTotal, plan.tax / 100);
    const totalAmount = FinanceCalculationService.add(subTotal, taxAmount);

    const invoice = await Invoice.create({
      invoiceNumber,
      enrollment: enrollmentId as any,
      student: enrollment.student,
      course: enrollment.course,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days net
      baseAmount: gross,
      taxAmount,
      discountAmount,
      scholarshipAmount,
      totalAmount,
      outstandingAmount: totalAmount,
      status: "issued",
    });

    await TimelineService.logEvent(invoice._id.toString(), "invoice-generated", `Invoice ${invoiceNumber} created for amount of $${(totalAmount / 100).toFixed(2)}`, userId);

    return invoice;
  }
}
