
/**
 * @swagger
 * /api/finance/payments:
 *   post:
 *     summary: Auto-generated summary for POST /api/finance/payments
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
 * /api/finance/payments:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/payments
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
import { paymentRepository } from "../../../../repositories/payment.repository";
import { PaymentService } from "../../../../services/finance/payment.service";

// GET – paginated payments list
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();

    const url = new URL(req.url);
    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || "paymentDate",
      order: url.searchParams.get("order") || undefined,
    });

    const status = url.searchParams.get("status");
    const paymentMethod = url.searchParams.get("paymentMethod");
    const invoice = url.searchParams.get("invoice");
    const gateway = url.searchParams.get("gateway");

    if (status) paginationInput.filters.status = status;
    if (paymentMethod) paginationInput.filters.paymentMethod = paymentMethod;
    if (invoice) paginationInput.filters.invoice = invoice;
    if (gateway) paginationInput.filters.gateway = gateway;

    // Students can only see their own payments
    if (userContext.role === "Student") {
      paginationInput.filters.student = userContext.userId;
    }

    const searchableFields = ["paymentNumber", "transactionReference"];
    const result = await paymentRepository.paginate(paginationInput, searchableFields, {
      populate: ["student", "invoice"],
    });

    return NextResponse.json(
      ResponseHelper.success("Payments fetched successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST – record a new payment
export const POST = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const payment = await PaymentService.recordPayment(body, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Payment recorded successfully", payment),
      { status: 201 }
    );
  })
);
