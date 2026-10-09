
/**
 * @swagger
 * /api/workflows:
 *   post:
 *     summary: Auto-generated summary for POST /api/workflows
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
 * /api/workflows:
 *   get:
 *     summary: Auto-generated summary for GET /api/workflows
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
import { withRoles } from "../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../helpers/response";
import { connectDB } from "../../../config/db";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { WorkflowService } from "../../../services/automation/workflow.service";

export const GET = withRoles(
  ["super-admin", "admin", "operations-manager", "academic-manager", "finance-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await WorkflowService.listWorkflows(params);
    return NextResponse.json(ResponseHelper.success("Workflows fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin"],
  async (req: NextRequest, user) => {
    await connectDB();
    const body = await req.json();
    const workflow = await WorkflowService.createWorkflow(body, user.userId);
    return NextResponse.json(ResponseHelper.success("Workflow created", workflow), { status: 201 });
  }
);
