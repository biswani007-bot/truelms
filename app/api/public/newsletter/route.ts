
/**
 * @swagger
 * /api/public/newsletter:
 *   post:
 *     summary: Auto-generated summary for POST /api/public/newsletter
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
 * /api/public/newsletter:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/newsletter
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
import { newsletterRepository } from "../../../../repositories/newsletter.repository";
import { formSubmissionRepository } from "../../../../repositories/form-submission.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import crypto from "crypto";

/**
 * Newsletter Subscription API — No authentication required.
 *
 * POST /api/public/newsletter
 * Body: { email, firstName?, source?, utmSource?, utmMedium?, utmCampaign? }
 *
 * GET /api/public/newsletter?token=xxx
 * Verifies double opt-in token
 */

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const body = await req.json();
  const { email, firstName, source, utmSource, utmMedium, utmCampaign } = body;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "";

  if (!email) {
    return NextResponse.json(
      ResponseHelper.error("Email address is required"),
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      ResponseHelper.error("Invalid email address"),
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already subscribed
  const existing = await newsletterRepository.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.status === "active") {
      return NextResponse.json(
        ResponseHelper.success("You are already subscribed to our newsletter."),
        { status: 200 }
      );
    }
    if (existing.status === "pending") {
      return NextResponse.json(
        ResponseHelper.success(
          "A verification email was already sent. Please check your inbox."
        ),
        { status: 200 }
      );
    }
    // Re-subscribe if previously unsubscribed
    const token = crypto.randomBytes(32).toString("hex");
    await newsletterRepository.update((existing._id as unknown as string).toString(), {
      status: "pending",
      verificationToken: token,
      verifiedAt: undefined,
      unsubscribedAt: undefined,
    } as Parameters<typeof newsletterRepository.update>[1]);

    await formSubmissionRepository.create({
      formType: "newsletter",
      data: { email: normalizedEmail, firstName, source, action: "resubscribe" },
      email: normalizedEmail,
      ipAddress: ip,
      userAgent,
      utmSource,
      utmMedium,
      utmCampaign,
      status: "processed",
    } as Parameters<typeof formSubmissionRepository.create>[0]);

    return NextResponse.json(
      ResponseHelper.success(
        "We have sent a new confirmation email. Please verify to complete subscription."
      ),
      { status: 200 }
    );
  }

  // New subscription
  const verificationToken = crypto.randomBytes(32).toString("hex");

  await newsletterRepository.create({
    email: normalizedEmail,
    firstName: firstName || "",
    status: "pending",
    verificationToken,
    source: source || "website",
    ipAddress: ip,
    userAgent,
    utmSource,
    utmMedium,
    utmCampaign,
  } as Parameters<typeof newsletterRepository.create>[0]);

  await formSubmissionRepository.create({
    formType: "newsletter",
    data: { email: normalizedEmail, firstName, source, action: "subscribe" },
    email: normalizedEmail,
    ipAddress: ip,
    userAgent,
    utmSource,
    utmMedium,
    utmCampaign,
    status: "processed",
  } as Parameters<typeof formSubmissionRepository.create>[0]);

  // TODO: Send verification email via notification service when SMTP is configured
  // The verification link is: /newsletter/verify?token=<verificationToken>

  return NextResponse.json(
    ResponseHelper.success(
      "Thank you for subscribing! Please check your email to confirm your subscription.",
      { requiresVerification: true }
    ),
    { status: 201 }
  );
});

export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      ResponseHelper.error("Verification token is required"),
      { status: 400 }
    );
  }

  const subscriber = await newsletterRepository.findOne({ verificationToken: token });

  if (!subscriber) {
    return NextResponse.json(
      ResponseHelper.error("Invalid or expired verification token"),
      { status: 404 }
    );
  }

  if (subscriber.status === "active") {
    return NextResponse.json(
      ResponseHelper.success("Your email is already verified."),
      { status: 200 }
    );
  }

  await newsletterRepository.update((subscriber._id as unknown as string).toString(), {
    status: "active",
    verifiedAt: new Date(),
    verificationToken: undefined,
  } as Parameters<typeof newsletterRepository.update>[1]);

  return NextResponse.json(
    ResponseHelper.success("Email verified successfully. Welcome to TrueLern updates!"),
    { status: 200 }
  );
});
