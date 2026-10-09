
/**
 * @swagger
 * /api/workflows/templates:
 *   post:
 *     summary: Auto-generated summary for POST /api/workflows/templates
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
 * /api/workflows/templates:
 *   get:
 *     summary: Auto-generated summary for GET /api/workflows/templates
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
import { connectDB } from "../../../../config/db";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { TemplateService } from "../../../../services/automation/template.service";

export const GET = withRoles(
  ["super-admin", "admin", "operations-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await TemplateService.listTemplates(params);
    return NextResponse.json(ResponseHelper.success("Workflow templates fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin"],
  async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    const template = await TemplateService.createTemplate(body);
    return NextResponse.json(ResponseHelper.success("Workflow template created", template), { status: 201 });
  }
);
