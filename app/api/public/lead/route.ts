
/**
 * @swagger
 * /api/public/lead:
 *   post:
 *     summary: Auto-generated summary for POST /api/public/lead
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
import { leadRepository } from "../../../../repositories/lead.repository";
import { leadTimelineRepository } from "../../../../repositories/lead-timeline.repository";
import { formSubmissionRepository } from "../../../../repositories/form-submission.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { Course } from "../../../../models/course.model";
import { applyCorsHeaders, handleCorsPreflight } from "../../../../lib/cors";

/**
 * OPTIONS /api/public/lead — Preflight handler
 */
export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req, { methods: ["POST", "OPTIONS"] });
}

/**
 * Public Lead & Demo Booking Submission API — No authentication required.
 * Used by:
 * 1. Book Free Demo Wizard (/book-demo)
 * 2. Contact Forms
 * 3. Inquiry Modals & Landing Pages
 *
 * POST /api/public/lead
 */
export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const body = await req.json();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "";

  const {
    // Standard and Demo Parent / Lead attributes
    firstName,
    lastName,
    parentName,
    name,
    email,
    phone,
    mobile,
    message,
    notes,
    courseInterest,
    programInterest,
    program,
    source,
    experience,
    subject,
    city,
    country,
    state,
    address,
    // Demo-specific attributes
    childName,
    childAge,
    preferredTime,
    mainConcern,
    consent,
    // UTM parameters
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    referrer,
    cohortId,
  } = body;

  // Resolve Lead Name
  const resolvedFullName = (
    parentName ||
    `${firstName || ""} ${lastName || ""}`.trim() ||
    name ||
    ""
  ).trim();

  const resolvedEmail = (email || "").toLowerCase().trim();
  const resolvedPhone = (phone || mobile || "").trim();

  // Validate required contact information
  if (!resolvedFullName || !resolvedEmail || !resolvedPhone) {
    return NextResponse.json(
      ResponseHelper.error("Missing required fields: name/parentName, email, and phone number"),
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(resolvedEmail)) {
    return NextResponse.json(
      ResponseHelper.error("Invalid email address"),
      { status: 400 }
    );
  }

  // Canonical Program Mapping table
  const DEMO_PROGRAM_MAP: Record<string, string> = {
    "junior-foundation": "Junior Foundation, Ages 6 to 10",
    "future-ready-builders": "Future-Ready Builders, Ages 9 to 14",
    "communication": "Communication and Public Speaking",
    "communication-confidence": "Communication and Public Speaking",
    "money-skills": "Money Skills",
    "ai-readiness": "AI Readiness",
  };

  const rawProgramKey = (programInterest || courseInterest || program || subject || "").toLowerCase().trim();
  let resolvedCourseInterest = DEMO_PROGRAM_MAP[rawProgramKey] || programInterest || courseInterest || program || subject || "General Inquiry";

  // Check if there is an exact matching course in the database to normalize name
  if (rawProgramKey) {
    const courseDoc = await Course.findOne({
      $or: [
        { slug: rawProgramKey },
        { courseName: new RegExp(`^${resolvedCourseInterest}$`, "i") },
      ],
      status: "published",
      isDeleted: { $ne: true },
    }).lean();

    if (courseDoc) {
      resolvedCourseInterest = (courseDoc as any).courseName;
    }
  }

  // Determine Source and Lead Status
  const isDemo =
    source === "demo-booking" ||
    source === "book-demo" ||
    source === "landing-page" ||
    Boolean(childName || childAge || preferredTime);

  const initialStatus = isDemo ? "demo_scheduled" : "new";

  // Map source to valid leadSource enum value
  const sourceMap: Record<string, string> = {
    "demo-booking": "landing-page",
    "book-demo": "landing-page",
    "landing-page": "landing-page",
    "contact-form": "website",
    "apply-form": "website",
    facebook: "facebook",
    instagram: "instagram",
    "google-ads": "google-ads",
    referral: "referral",
    partner: "partner",
  };
  const leadSource = sourceMap[source] || (isDemo ? "landing-page" : "website");

  // Format rich notes and tags for demo registration
  let structuredNotes = notes || message || "";
  const tags: string[] = [source || (isDemo ? "demo-booking" : "website")];

  if (isDemo) {
    tags.push("free-demo");
    if (childName) tags.push(`child:${childName}`);
    if (childAge) tags.push(`age:${childAge}`);
    if (preferredTime) tags.push(`slot:${preferredTime}`);
    if (mainConcern) tags.push(`concern:${mainConcern}`);

    const demoSummary = [
      `--- DEMO REGISTRATION DETAILS ---`,
      `Child Name: ${childName || "N/A"}`,
      `Child Age: ${childAge || "N/A"}`,
      `Program Interest: ${resolvedCourseInterest}`,
      `Preferred Schedule: ${preferredTime || "Flexible"}`,
      `Primary Concern: ${mainConcern || "None specified"}`,
      `Parent/Guardian: ${resolvedFullName}`,
      `Contact Consent: ${consent ? "Yes" : "No"}`,
      notes || message ? `Parent Note: ${notes || message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    structuredNotes = structuredNotes ? `${demoSummary}\n\n${structuredNotes}` : demoSummary;
  }

  if (cohortId) tags.push("cohort-apply");

  // Location fields
  const resolvedCountry = country || (city?.toLowerCase().includes("canada") ? "Canada" : "USA");
  const resolvedCity = city || "Unknown";
  const resolvedState = state || "Unknown";

  let lead: any = null;
  let leadId: string | undefined;

  try {
    // 1. Idempotency Check: Existing lead with same email or phone
    const existingLead = await leadRepository.findOne({
      $or: [{ email: resolvedEmail }, { phone: resolvedPhone }],
      isDeleted: { $ne: true },
    });

    if (existingLead) {
      leadId = existingLead.leadId;

      // Update existing lead with latest demo interest without overwriting converted status
      const updatedStatus =
        existingLead.status === "enrolled" || existingLead.status === "admission_offered"
          ? existingLead.status
          : isDemo
          ? "demo_scheduled"
          : existingLead.status;

      const mergedNotes = existingLead.notes
        ? `${existingLead.notes}\n\n[Updated ${new Date().toLocaleDateString()}]:\n${structuredNotes}`
        : structuredNotes;

      const mergedTags = Array.from(new Set([...(existingLead.tags || []), ...tags]));

      lead = await leadRepository.update(existingLead._id.toString(), {
        fullName: resolvedFullName,
        phone: resolvedPhone,
        interestedCourse: resolvedCourseInterest,
        city: resolvedCity !== "Unknown" ? resolvedCity : existingLead.city,
        country: resolvedCountry !== "Unknown" ? resolvedCountry : existingLead.country,
        state: resolvedState !== "Unknown" ? resolvedState : existingLead.state,
        notes: mergedNotes,
        tags: mergedTags,
        status: updatedStatus,
        priority: isDemo ? "high" : existingLead.priority,
      } as any);

      // Record timeline event
      await leadTimelineRepository.create({
        lead: existingLead._id,
        event: isDemo ? "demo_scheduled" : "followup",
        description: isDemo
          ? `Free Demo requested for child ${childName || ""} (${resolvedCourseInterest}) — Preferred Slot: ${preferredTime || "Flexible"}`
          : `Inquiry resubmitted via ${source || "website"}`,
      } as any);
    } else {
      // 2. Create brand new lead
      const count = await leadRepository.findMany().then((res) => res.length);
      leadId = `LED-${1000 + count + 1}`;

      lead = await leadRepository.create({
        leadId,
        fullName: resolvedFullName,
        email: resolvedEmail,
        phone: resolvedPhone,
        interestedCourse: resolvedCourseInterest,
        country: resolvedCountry,
        state: resolvedState,
        city: resolvedCity,
        address: address || "",
        leadSource: leadSource as any,
        learningMode: "live",
        priority: isDemo ? "high" : "medium",
        status: initialStatus as any,
        notes: structuredNotes,
        campaign: utmCampaign,
        utmSource,
        utmMedium,
        utmCampaign,
        tags,
      } as any);

      // Record created timeline event
      await leadTimelineRepository.create({
        lead: lead._id,
        event: isDemo ? "demo_scheduled" : "created",
        description: isDemo
          ? `Free Demo registered for child ${childName || ""} (${resolvedCourseInterest}) — Preferred Slot: ${preferredTime || "Flexible"}`
          : `Lead submitted via public ${source || "website"} form`,
      } as any);
    }
  } catch (err: any) {
    console.error("[PublicLead] Lead persistence error:", err);
    leadId = undefined;
  }

  // Audit log — Always record the form submission
  await formSubmissionRepository.create({
    formType: isDemo ? "demo" : source === "apply-form" ? "apply" : "contact",
    data: {
      fullName: resolvedFullName,
      email: resolvedEmail,
      phone: resolvedPhone,
      courseInterest: resolvedCourseInterest,
      childName,
      childAge,
      preferredTime,
      mainConcern,
      consent,
      city: resolvedCity,
      source,
      experience,
      notes: structuredNotes,
    },
    email: resolvedEmail,
    ipAddress: ip,
    userAgent,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    referrer,
    leadId,
    status: lead ? "processed" : "failed",
    errorMessage: lead ? undefined : "Lead creation failed",
  } as any);

  if (!lead) {
    return applyCorsHeaders(
      req,
      NextResponse.json(
        ResponseHelper.error("Failed to submit your request. Please try again or contact support."),
        { status: 500 }
      )
    );
  }

  const successMessage = isDemo
    ? "Demo booked successfully! Our admissions team will contact you shortly to confirm the live class slot."
    : "Your inquiry has been received. Our team will contact you within 24 hours.";

  return applyCorsHeaders(
    req,
    NextResponse.json(
      ResponseHelper.success(successMessage, {
        leadId,
        status: lead.status,
        program: resolvedCourseInterest,
      }),
      { status: 201 }
    )
  );
});
