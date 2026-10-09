
/**
 * @swagger
 * /api/public/events:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/events
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
import { connectDB } from "../../../../config/db";
import { eventRepository } from "../../../../repositories/event.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";

/**
 * Public Events API — No authentication required.
 * GET /api/public/events — Returns published events
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const url = req.nextUrl;
  const featuredOnly = url.searchParams.get("featured") === "true";
  const mode = url.searchParams.get("mode");
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  const filter: Record<string, unknown> = { status: "published" };
  if (featuredOnly) filter.featured = true;
  if (mode && ["online", "offline", "hybrid"].includes(mode)) filter.mode = mode;

  const events = await eventRepository.findMany(filter, { limit, sort: { eventDate: 1 } } as Parameters<typeof eventRepository.findMany>[1]);

  return NextResponse.json(
    ResponseHelper.success("Events fetched successfully", events),
    { status: 200 }
  );
});
