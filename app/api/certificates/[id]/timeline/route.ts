
/**
 * @swagger
 * /api/certificates/{id}/timeline:
 *   get:
 *     summary: Auto-generated summary for GET /api/certificates/{id}/timeline
 *     tags: [certificates]
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
import { certificateTimelineRepository } from "../../../../../repositories/certificate-timeline.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const timeline = await certificateTimelineRepository.findMany(
      { certificate: id },
      { sort: "timestamp", order: "desc" } as any
    );

    return NextResponse.json(ResponseHelper.success("Timeline logs fetched", timeline), { status: 200 });
  })
);
