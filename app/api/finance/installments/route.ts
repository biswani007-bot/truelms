
/**
 * @swagger
 * /api/finance/installments:
 *   post:
 *     summary: Auto-generated summary for POST /api/finance/installments
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
 * /api/finance/installments:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/installments
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
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { connectDB } from "../../../../config/db";
import { paymentInstallmentRepository } from "../../../../repositories/payment-installment.repository";
import { InstallmentService } from "../../../../services/finance/installment.service";

// GET – paginated installments
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const url = new URL(req.url);
    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      sort: url.searchParams.get("sort") || "dueDate",
      order: url.searchParams.get("order") || undefined,
    });

    const status = url.searchParams.get("status");
    const invoice = url.searchParams.get("invoice");
    const overdue = url.searchParams.get("overdue");

    if (status) paginationInput.filters.status = status;
    if (invoice) paginationInput.filters.invoice = invoice;

    // Special: return only overdue installments
    if (overdue === "true") {
      const overdueList = await InstallmentService.getOverdue();
      return NextResponse.json(
        ResponseHelper.success("Overdue installments fetched", overdueList),
        { status: 200 }
      );
    }

    const result = await paymentInstallmentRepository.paginate(paginationInput, [], {
      populate: ["invoice"],
    });

    return NextResponse.json(
      ResponseHelper.success("Installments fetched successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST – generate installment schedule for an invoice
export const POST = withRoles(
  ["Admin", "Super Admin", "Finance Manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const { invoiceId, schedules } = await req.json();

    if (!invoiceId || !schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json(
        ResponseHelper.error("invoiceId and schedules[] are required"),
        { status: 400 }
      );
    }

    const installments = await InstallmentService.generateInstallments(invoiceId, schedules);
    return NextResponse.json(
      ResponseHelper.success("Installment schedule generated", installments),
      { status: 201 }
    );
  })
);
