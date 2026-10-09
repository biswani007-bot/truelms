
/**
 * @swagger
 * /api/certificates/{id}/reject:
 *   post:
 *     summary: Auto-generated summary for POST /api/certificates/{id}/reject
 *     tags: [certificates]
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
import { ApprovalService } from "../../../../../services/certificate/approval.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const { remarks } = await req.json();

    if (!remarks) {
      return NextResponse.json(ResponseHelper.error("Remarks explanation is required for rejection"), { status: 450 });
    }

    const approval = await ApprovalService.reject(id, userContext.userId, remarks);

    return NextResponse.json(ResponseHelper.success("Certificate request rejected", approval), { status: 200 });
  })
);
