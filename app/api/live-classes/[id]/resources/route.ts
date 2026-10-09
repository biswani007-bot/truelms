
/**
 * @swagger
 * /api/live-classes/{id}/resources:
 *   post:
 *     summary: Auto-generated summary for POST /api/live-classes/{id}/resources
 *     tags: [live-classes]
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
 * /api/live-classes/{id}/resources:
 *   get:
 *     summary: Auto-generated summary for GET /api/live-classes/{id}/resources
 *     tags: [live-classes]
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
import { liveClassResourceRepository } from "../../../../../repositories/live-class-resource.repository";
import { ResourceService } from "../../../../../services/live-class/resource.service";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET All Resources for Live Class
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const resources = await liveClassResourceRepository.findMany({ liveClass: id });

    return NextResponse.json(ResponseHelper.success("Resources fetched", resources), { status: 200 });
  })
);

// POST Add Resource to Live Class
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const resource = await ResourceService.attachResource(id, body, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Resource attached successfully", resource), { status: 201 });
  })
);
