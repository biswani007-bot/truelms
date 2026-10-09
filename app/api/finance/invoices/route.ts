
/**
 * @swagger
 * /api/finance/invoices:
 *   post:
 *     summary: Auto-generated summary for POST /api/finance/invoices
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
 * /api/finance/invoices:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/invoices
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
import { invoiceRepository } from "../../../../repositories/invoice.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { connectDB } from "../../../../config/db";
import { InvoiceService } from "../../../../services/finance/invoice.service";

// GET Paginated Invoices
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();

    const url = new URL(req.url);
    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    });

    const status = url.searchParams.get("status");
    const course = url.searchParams.get("course");

    if (status) paginationInput.filters.status = status;
    if (course) paginationInput.filters.course = course;

    // Enforce Student reads own invoices only
    if (userContext.role === "Student") {
      paginationInput.filters.student = userContext.userId;
    }

    const searchableFields = ["invoiceNumber"];
    const result = await invoiceRepository.paginate(paginationInput, searchableFields, {
      populate: ["student", "course"],
    });

    return NextResponse.json(
      ResponseHelper.success("Invoices fetched successfully", result.data, result.meta),
      { status: 200 }
    );
  })
);

// POST Generate Invoice Manual
export const POST = withRoles(
  ["Admin", "Super Admin", "Finance Manager"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const { enrollmentId, feePlanId, discountAmount, scholarshipAmount } = await req.json();

    if (!enrollmentId || !feePlanId) {
      return NextResponse.json(ResponseHelper.error("enrollmentId and feePlanId are required"), { status: 400 });
    }

    const invoice = await InvoiceService.generateInvoice(
      enrollmentId,
      feePlanId,
      discountAmount || 0,
      scholarshipAmount || 0,
      userContext.userId
    );

    return NextResponse.json(ResponseHelper.success("Invoice generated successfully", invoice), { status: 201 });
  })
);
