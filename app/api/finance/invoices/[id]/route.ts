
/**
 * @swagger
 * /api/finance/invoices/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/finance/invoices/{id}
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
 * /api/finance/invoices/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/invoices/{id}
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { invoiceRepository } from "../../../../../repositories/invoice.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const invoice = await invoiceRepository.findById(id, {
      populate: ["student", "course"],
    });

    if (!invoice) {
      return NextResponse.json(ResponseHelper.error("Invoice not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Invoice fetched successfully", invoice), { status: 200 });
  })
);

export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const deleted = await invoiceRepository.softDelete(id);
    if (!deleted) {
      return NextResponse.json(ResponseHelper.error("Invoice not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Invoice cancelled/archived successfully", deleted), { status: 200 });
  })
);
