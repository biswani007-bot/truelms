
/**
 * @swagger
 * /api/batches/{id}/students/swap:
 *   post:
 *     summary: Auto-generated summary for POST /api/batches/{id}/students/swap
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
import { AssignmentService } from "../../../../../../services/batch/assignment.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST Swap two students between batches
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const { studentAId, batchBId, studentBId } = body;
    if (!studentAId || !batchBId || !studentBId) {
      return NextResponse.json(
        ResponseHelper.error("studentAId, batchBId, and studentBId are required"),
        { status: 400 }
      );
    }

    const result = await AssignmentService.swapStudents(id, studentAId, batchBId, studentBId, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Students swapped successfully", result),
      { status: 200 }
    );
  })
);
