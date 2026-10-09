
/**
 * @swagger
 * /api/public/partners:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/partners
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
import { partnerRepository } from "../../../../repositories/partner.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";

/**
 * Public Partners API — No authentication required.
 * GET /api/public/partners — Returns active partners ordered by display order
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const url = req.nextUrl;
  const type = url.searchParams.get("type");
  const featuredOnly = url.searchParams.get("featured") === "true";

  const filter: Record<string, unknown> = { status: "active" };
  if (type) filter.type = type;
  if (featuredOnly) filter.featured = true;

  const partners = await partnerRepository.findMany(filter, {
    sort: { order: 1 },
  } as Parameters<typeof partnerRepository.findMany>[1]);

  return NextResponse.json(
    ResponseHelper.success("Partners fetched successfully", partners),
    { status: 200 }
  );
});
