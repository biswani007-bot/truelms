
/**
 * @swagger
 * /api/crm/leads:
 *   post:
 *     summary: Auto-generated summary for POST /api/crm/leads
 *     tags: [crm]
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
 * /api/crm/leads:
 *   get:
 *     summary: Auto-generated summary for GET /api/crm/leads
 *     tags: [crm]
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { leadRepository } from "../../../../repositories/lead.repository";
import { leadTimelineRepository } from "../../../../repositories/lead-timeline.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { connectDB } from "../../../../config/db";

// GET leads
export const GET = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();

    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const limit = url.searchParams.get("limit");
    const search = url.searchParams.get("search") || undefined;
    const sort = url.searchParams.get("sort") || undefined;
    const order = url.searchParams.get("order") || undefined;

    const paginationInput = PaginationSchema.parse({
      page,
      limit,
      search,
      sort,
      order,
    });

    // Custom Filters
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    if (status) paginationInput.filters.status = status;
    if (priority) paginationInput.filters.priority = priority;

    // RBAC: Sales Counsellor can only access assigned leads
    if (userContext.role === "Sales Counsellor") {
      paginationInput.filters.leadOwner = userContext.userId;
    }

    const searchableFields = ["fullName", "email", "phone", "interestedCourse", "leadId"];
    const result = await leadRepository.paginate(paginationInput, searchableFields, { populate: ["leadOwner", "parent"] as any });

    const enrichedData = (result.data || []).map((leadItem: any) => {
      const itemObj = leadItem.toObject ? leadItem.toObject() : { ...leadItem };
      if (itemObj.parent && typeof itemObj.parent === "object" && (itemObj.parent.firstName || itemObj.parent.lastName)) {
        const authoritativeParentName = `${itemObj.parent.firstName || ""} ${itemObj.parent.lastName || ""}`.trim();
        if (authoritativeParentName) {
          itemObj.fullName = authoritativeParentName;
        }
      }
      return itemObj;
    });

    return NextResponse.json(
      ResponseHelper.success("Fetched leads successfully", enrichedData, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Lead
export const POST = withRoles(
  ["Admin", "Super Admin", "Marketing Manager", "Sales Counsellor"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    // Generate unique Lead ID
    const count = await leadRepository.findMany().then((res) => res.length);
    const leadId = `LED-${1000 + count + 1}`;

    const leadData = {
      ...body,
      leadId,
      status: body.status || "new",
      leadOwner: body.leadOwner || userContext.userId,
    };

    const lead = await leadRepository.create(leadData);

    // Initial Timeline Event
    await leadTimelineRepository.create({
      lead: lead._id,
      event: "created",
      description: `Lead created successfully via ${lead.leadSource}`,
      performedBy: userContext.userId,
    });

    return NextResponse.json(
      ResponseHelper.success("Lead created successfully", lead),
      { status: 201 }
    );
  })
);
