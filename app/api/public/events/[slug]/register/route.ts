
/**
 * @swagger
 * /api/public/events/{slug}/register:
 *   post:
 *     summary: Auto-generated summary for POST /api/public/events/{slug}/register
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
import { connectDB } from "../../../../../../config/db";
import { eventRepository } from "../../../../../../repositories/event.repository";
import { eventRegistrationRepository } from "../../../../../../repositories/event-registration.repository";
import { formSubmissionRepository } from "../../../../../../repositories/form-submission.repository";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Event Registration API — No authentication required.
 * POST /api/public/events/[slug]/register
 */
export const POST = apiHandler(
  async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
    await connectDB();

    const { slug } = await routeCtx.params;
    const body = await req.json();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      designation,
      message,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!firstName || !email) {
      return NextResponse.json(
        ResponseHelper.error("First name and email are required"),
        { status: 400 }
      );
    }

    const event = await eventRepository.findOne({ slug, status: "published" });

    if (!event) {
      return NextResponse.json(
        ResponseHelper.error("Event not found"),
        { status: 404 }
      );
    }

    if (!event.registrationOpen) {
      return NextResponse.json(
        ResponseHelper.error("Registration is closed for this event"),
        { status: 400 }
      );
    }

    if (
      event.capacity &&
      event.registeredCount >= event.capacity
    ) {
      return NextResponse.json(
        ResponseHelper.error("This event is at full capacity"),
        { status: 400 }
      );
    }

    // Check for duplicate registration
    const existing = await eventRegistrationRepository.findOne({
      event: event._id,
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      return NextResponse.json(
        ResponseHelper.success(
          "You are already registered for this event. See you there!",
          { alreadyRegistered: true }
        ),
        { status: 200 }
      );
    }

    const registration = await eventRegistrationRepository.create({
      event: event._id,
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase().trim(),
      phone,
      company,
      designation,
      message,
      status: "registered",
      registeredAt: new Date(),
      ipAddress: ip,
      utmSource,
      utmMedium,
      utmCampaign,
    } as Parameters<typeof eventRegistrationRepository.create>[0]);

    // Increment registered count
    await eventRepository.update((event._id as unknown as string).toString(), {
      registeredCount: event.registeredCount + 1,
    } as Parameters<typeof eventRepository.update>[1]);

    // Audit log
    await formSubmissionRepository.create({
      formType: "event-registration",
      data: { firstName, lastName, email, phone, company, designation, eventSlug: slug },
      email: email.toLowerCase().trim(),
      ipAddress: ip,
      userAgent,
      utmSource,
      utmMedium,
      utmCampaign,
      status: "processed",
    } as Parameters<typeof formSubmissionRepository.create>[0]);

    return NextResponse.json(
      ResponseHelper.success(
        "You have successfully registered for this event. A confirmation will be sent to your email.",
        { registrationId: registration._id }
      ),
      { status: 201 }
    );
  }
);
