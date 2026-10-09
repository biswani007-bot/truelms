
/**
 * @swagger
 * /api/finance/fee-plans/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/finance/fee-plans/{id}
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
 * /api/finance/fee-plans/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/finance/fee-plans/{id}
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
 * /api/finance/fee-plans/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/finance/fee-plans/{id}
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
import { FeePlanService } from "../../../../../services/finance/fee-plan.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET – get single fee plan
export const GET = withRoles(
  ["Admin", "Super Admin", "Finance Manager", "Accountant"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const feePlan = await FeePlanService.findById(id);
    if (!feePlan) {
      return NextResponse.json(ResponseHelper.error("Fee plan not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Fee plan fetched", feePlan), { status: 200 });
  })
);

// PUT – update fee plan
export const PUT = withRoles(
  ["Admin", "Super Admin", "Finance Manager"],
  apiHandler(async (req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const feePlan = await FeePlanService.update(id, body);
    return NextResponse.json(
      ResponseHelper.success("Fee plan updated successfully", feePlan),
      { status: 200 }
    );
  })
);

// DELETE – soft delete fee plan
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    await FeePlanService.delete(id);
    return NextResponse.json(
      ResponseHelper.success("Fee plan archived successfully", null),
      { status: 200 }
    );
  })
);
