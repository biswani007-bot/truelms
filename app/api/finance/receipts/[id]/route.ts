
/**
 * @swagger
 * /api/finance/receipts/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/receipts/{id}
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
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { receiptRepository } from "../../../../../repositories/receipt.repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET – get single receipt
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant", "Student"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const receipt = await receiptRepository.findById(id, {
      populate: ["invoice", "payment"],
    });

    if (!receipt) {
      return NextResponse.json(ResponseHelper.error("Receipt not found"), { status: 404 });
    }

    return NextResponse.json(
      ResponseHelper.success("Receipt fetched successfully", receipt),
      { status: 200 }
    );
  })
);
