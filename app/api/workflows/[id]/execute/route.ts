
/**
 * @swagger
 * /api/workflows/{id}/execute:
 *   post:
 *     summary: Auto-generated summary for POST /api/workflows/{id}/execute
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
import { ExecutionService } from "../../../../../services/automation/execution.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();
    const { payload = {} } = body;

    const wf = await WorkflowService.findWorkflow(id);
    if (!wf) {
      return NextResponse.json(ResponseHelper.error("Workflow not found"), { status: 404 });
    }

    const executed = await ExecutionService.executeWorkflow(wf, wf.trigger.type, payload);
    return NextResponse.json(ResponseHelper.success("Workflow executed manually", { executed }));
  })
);
