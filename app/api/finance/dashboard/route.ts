
/**
 * @swagger
 * /api/finance/dashboard:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/dashboard
 *     tags: [finance]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
import { NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { invoiceRepository } from "../../../../repositories/invoice.repository";
import { paymentRepository } from "../../../../repositories/payment.repository";
import { refundRepository } from "../../../../repositories/refund.repository";
import { InstallmentService } from "../../../../services/finance/installment.service";

export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant"],
  apiHandler(async () => {
    await connectDB();

    const invoices = await invoiceRepository.findMany({});
    const payments = await paymentRepository.findMany({});
    const refunds = await refundRepository.findMany({});
    const overdueInstallments = await InstallmentService.getOverdue();

    const revenue = invoices.reduce((sum, item) => sum + item.totalAmount, 0);
    const collections = payments.reduce((sum, item) => sum + item.amount, 0);
    const outstanding = invoices.reduce((sum, item) => sum + item.outstandingAmount, 0);
    const totalRefunds = refunds.reduce((sum, item) => sum + item.amount, 0);

    // Overdue invoices
    const overdueInvoices = invoices.filter(inv => inv.status === "overdue");

    // Payment method breakdown
    const methodBreakdown: Record<string, { count: number; total: number }> = {};
    for (const pmt of payments) {
      const method = pmt.paymentMethod;
      if (!methodBreakdown[method]) methodBreakdown[method] = { count: 0, total: 0 };
      methodBreakdown[method].count += 1;
      methodBreakdown[method].total += pmt.amount;
    }

    // Installments due (next 7 days)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const allInstallments = await InstallmentService.getOverdue();
    const installmentsDueSoon = allInstallments.filter(
      (inst) => new Date(inst.dueDate) <= sevenDaysFromNow
    );

    return NextResponse.json(
      ResponseHelper.success("Finance statistics aggregated", {
        revenue,
        collections,
        outstanding,
        refunds: totalRefunds,
        invoicesCount: invoices.length,
        paymentsCount: payments.length,
        overdueInvoicesCount: overdueInvoices.length,
        overdueInstallmentsCount: overdueInstallments.length,
        installmentsDueSoonCount: installmentsDueSoon.length,
        paymentMethodBreakdown: methodBreakdown,
      }),
      { status: 200 }
    );
  })
);
