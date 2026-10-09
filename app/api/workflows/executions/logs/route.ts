
/**
 * @swagger
 * /api/workflows/executions/logs:
 *   get:
 *     summary: Auto-generated summary for GET /api/workflows/executions/logs
 *     tags: [workflows]
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { connectDB } from "../../../../../config/db";
import { PaginationSchema } from "../../../../../dtos/pagination.dto";
import { ExecutionService } from "../../../../../services/automation/execution.service";

export const GET = withRoles(
  ["super-admin", "admin", "operations-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await ExecutionService.listExecutionLogs(params);
    return NextResponse.json(ResponseHelper.success("Workflow execution step logs fetched", result));
  }
);
