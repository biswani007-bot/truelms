
/**
 * @swagger
 * /api/batches/{id}/students/transfer:
 *   post:
 *     summary: Auto-generated summary for POST /api/batches/{id}/students/transfer
 *     tags: [batches]
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
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";
import { TransferService } from "../../../../../../services/batch/transfer.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST Transfer student to another batch
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const { studentId, toBatchId } = body;
    if (!studentId || !toBatchId) {
      return NextResponse.json(
        ResponseHelper.error("studentId and toBatchId are required"),
        { status: 400 }
      );
    }

    const result = await TransferService.transferStudent(id, studentId, toBatchId, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Student transferred successfully", result),
      { status: 200 }
    );
  })
);
