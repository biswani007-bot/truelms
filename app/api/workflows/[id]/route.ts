
/**
 * @swagger
 * /api/workflows/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/workflows/{id}
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

/**
 * @swagger
 * /api/workflows/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/workflows/{id}
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

/**
 * @swagger
 * /api/workflows/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/workflows/{id}
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { WorkflowService } from "../../../../services/automation/workflow.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withRoles(
  ["super-admin", "admin", "operations-manager", "academic-manager", "finance-manager"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const workflow = await WorkflowService.findWorkflow(id);
    if (!workflow) {
      return NextResponse.json(ResponseHelper.error("Workflow not found"), { status: 404 });
    }
    return NextResponse.json(ResponseHelper.success("Workflow fetched", workflow));
  })
);

export const PUT = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();
    const updated = await WorkflowService.updateWorkflow(id, body);
    return NextResponse.json(ResponseHelper.success("Workflow updated", updated));
  })
);

export const DELETE = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    await WorkflowService.deleteWorkflow(id);
    return NextResponse.json(ResponseHelper.success("Workflow deleted"));
  })
);
