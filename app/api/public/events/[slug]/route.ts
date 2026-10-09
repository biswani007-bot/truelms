
/**
 * @swagger
 * /api/public/events/{slug}:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/events/{slug}
 *     tags: [public]
 *     
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
import { connectDB } from "../../../../../config/db";
import { eventRepository } from "../../../../../repositories/event.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Public Event Detail API — No authentication required.
 * GET /api/public/events/[slug]
 */
export const GET = apiHandler(
  async (_req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();

    const { slug } = await routeCtx.params;
    const event = await eventRepository.findOne({ slug, status: "published" });

    if (!event) {
      return NextResponse.json(
        ResponseHelper.error("Event not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ResponseHelper.success("Event fetched successfully", event),
      { status: 200 }
    );
  }
);
