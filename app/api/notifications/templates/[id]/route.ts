
/**
 * @swagger
 * /api/notifications/templates/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/notifications/templates/{id}
 *     tags: [notifications]
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
 * /api/notifications/templates/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/notifications/templates/{id}
 *     tags: [notifications]
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
 * /api/notifications/templates/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/notifications/templates/{id}
 *     tags: [notifications]
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
import { TemplateService } from "../../../../../services/notification/template.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withRoles(
  ["super-admin", "admin", "marketing", "support"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const template = await TemplateService.findTemplate(id);
    if (!template) {
      return NextResponse.json(ResponseHelper.error("Template not found"), { status: 404 });
    }
    return NextResponse.json(ResponseHelper.success("Template fetched", template));
  })
);

export const PUT = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();
    const updated = await TemplateService.updateTemplate(id, body);
    return NextResponse.json(ResponseHelper.success("Template updated", updated));
  })
);

export const DELETE = withRoles(
  ["super-admin", "admin"],
  apiHandler(async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    await TemplateService.deleteTemplate(id);
    return NextResponse.json(ResponseHelper.success("Template deleted"));
  })
);
