
/**
 * @swagger
 * /api/workflows/{id}/pause:
 *   post:
 *     summary: Auto-generated summary for POST /api/workflows/{id}/pause
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
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { WorkflowService } from "../../../../../services/automation/workflow.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const updated = await WorkflowService.pause(id);
    return NextResponse.json(ResponseHelper.success("Workflow paused", updated));
  })
);
