
/**
 * @swagger
 * /api/public/newsletter/unsubscribe:
 *   post:
 *     summary: Auto-generated summary for POST /api/public/newsletter/unsubscribe
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

/**
 * @swagger
 * /api/public/newsletter/unsubscribe:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/newsletter/unsubscribe
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
import { newsletterRepository } from "../../../../../repositories/newsletter.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";

/**
 * Newsletter Unsubscribe API — No authentication required.
 *
 * GET  /api/public/newsletter/unsubscribe?token=xxx  → unsubscribe by token
 * POST /api/public/newsletter/unsubscribe            → body: { email } → find and unsubscribe
 */

export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");

  if (!token && !email) {
    return NextResponse.json(
      ResponseHelper.error("Verification token or email is required"),
      { status: 400 }
    );
  }

  const filter = token ? { verificationToken: token } : { email: email!.toLowerCase().trim() };
  const subscriber = await newsletterRepository.findOne(filter);

  if (!subscriber) {
    return NextResponse.json(
      ResponseHelper.error("Subscriber not found"),
      { status: 404 }
    );
  }

  if (subscriber.status === "unsubscribed") {
    return NextResponse.json(
      ResponseHelper.success("You are already unsubscribed."),
      { status: 200 }
    );
  }

  await newsletterRepository.update((subscriber._id as unknown as string).toString(), {
    status: "unsubscribed",
    unsubscribedAt: new Date(),
    verificationToken: undefined,
  } as Parameters<typeof newsletterRepository.update>[1]);

  return NextResponse.json(
    ResponseHelper.success("You have been successfully unsubscribed from TrueLern updates."),
    { status: 200 }
  );
});

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const body = await req.json();
  const email = body.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json(
      ResponseHelper.error("Email address is required"),
      { status: 400 }
    );
  }

  const subscriber = await newsletterRepository.findOne({ email });

  if (!subscriber) {
    return NextResponse.json(
      ResponseHelper.success(
        "If that email is subscribed, you will be unsubscribed shortly."
      ),
      { status: 200 }
    );
  }

  if (subscriber.status === "unsubscribed") {
    return NextResponse.json(
      ResponseHelper.success("You are already unsubscribed."),
      { status: 200 }
    );
  }

  await newsletterRepository.update((subscriber._id as unknown as string).toString(), {
    status: "unsubscribed",
    unsubscribedAt: new Date(),
  } as Parameters<typeof newsletterRepository.update>[1]);

  return NextResponse.json(
    ResponseHelper.success("Successfully unsubscribed from TrueLern newsletter."),
    { status: 200 }
  );
});
