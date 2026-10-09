
/**
 * @swagger
 * /api/finance/invoice-items:
 *   post:
 *     summary: Auto-generated summary for POST /api/finance/invoice-items
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

/**
 * @swagger
 * /api/finance/invoice-items:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/invoice-items
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { invoiceItemRepository } from "../../../../repositories/invoice-item.repository";
import { InvoiceItem } from "../../../../models/invoice-item.model";
import { FinanceCalculationService } from "../../../../services/finance/finance-calculation.service";

// GET – items for a specific invoice
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const url = new URL(req.url);
    const invoice = url.searchParams.get("invoice");

    if (!invoice) {
      return NextResponse.json(
        ResponseHelper.error("invoice query param is required"),
        { status: 400 }
      );
    }

    const items = await invoiceItemRepository.findMany({ invoice: invoice as any });
    return NextResponse.json(
      ResponseHelper.success("Invoice items fetched", items),
      { status: 200 }
    );
  })
);

// POST – add a line item to an invoice
export const POST = withRoles(
  ["Admin", "Super Admin", "Finance Manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const { invoiceId, description, quantity, unitPrice } = await req.json();

    if (!invoiceId || !description || !unitPrice) {
      return NextResponse.json(
        ResponseHelper.error("invoiceId, description, and unitPrice are required"),
        { status: 400 }
      );
    }

    const qty = quantity || 1;
    const totalPrice = FinanceCalculationService.multiply(unitPrice, qty);

    const item = await InvoiceItem.create({
      invoice: invoiceId as any,
      description,
      quantity: qty,
      unitPrice,
      totalPrice,
    });

    return NextResponse.json(
      ResponseHelper.success("Invoice item added successfully", item),
      { status: 201 }
    );
  })
);
