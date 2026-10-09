
/**
 * @swagger
 * /api/finance/refunds/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/refunds/{id}
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
import { refundRepository } from "../../../../../repositories/refund.repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET – get single refund
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const refund = await refundRepository.findById(id, {
      populate: ["invoice", "payment"],
    });

    if (!refund) {
      return NextResponse.json(ResponseHelper.error("Refund not found"), { status: 404 });
    }

    return NextResponse.json(
      ResponseHelper.success("Refund fetched successfully", refund),
      { status: 200 }
    );
  })
);
