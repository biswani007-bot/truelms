
/**
 * @swagger
 * /api/finance/refunds:
 *   post:
 *     summary: Auto-generated summary for POST /api/finance/refunds
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
 * /api/finance/refunds:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/refunds
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
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { connectDB } from "../../../../config/db";
import { refundRepository } from "../../../../repositories/refund.repository";
import { RefundService } from "../../../../services/finance/refund.service";

// GET – paginated refunds list
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const url = new URL(req.url);
    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || "refundDate",
      order: url.searchParams.get("order") || undefined,
    });

    const status = url.searchParams.get("status");
    const invoice = url.searchParams.get("invoice");

    if (status) paginationInput.filters.status = status;
    if (invoice) paginationInput.filters.invoice = invoice;

    const searchableFields = ["refundNumber", "reason"];
    const result = await refundRepository.paginate(paginationInput, searchableFields, {
      populate: ["invoice", "payment"],
    });

    return NextResponse.json(
      ResponseHelper.success("Refunds fetched successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST – request a refund
export const POST = withRoles(
  ["Admin", "Super Admin", "Finance Manager"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const { invoiceId, paymentId, amount, reason } = await req.json();

    if (!invoiceId || !paymentId || !amount || !reason) {
      return NextResponse.json(
        ResponseHelper.error("invoiceId, paymentId, amount, reason are required"),
        { status: 400 }
      );
    }

    const refund = await RefundService.requestRefund(invoiceId, paymentId, amount, reason, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Refund request submitted successfully", refund),
      { status: 201 }
    );
  })
);
