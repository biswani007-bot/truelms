
/**
 * @swagger
 * /api/cms/{model}:
 *   post:
 *     summary: Auto-generated summary for POST /api/cms/{model}
 *     tags: [cms]
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
 * /api/cms/{model}:
 *   get:
 *     summary: Auto-generated summary for GET /api/cms/{model}
 *     tags: [cms]
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
import { pageRepository } from "../../../../repositories/page.repository";
import { blogRepository } from "../../../../repositories/blog.repository";
import { categoryRepository } from "../../../../repositories/category.repository";
import { authorRepository } from "../../../../repositories/author.repository";
import { faqRepository } from "../../../../repositories/faq.repository";
import { testimonialRepository } from "../../../../repositories/testimonial.repository";
import { mediaRepository } from "../../../../repositories/media.repository";
import { navigationRepository } from "../../../../repositories/navigation.repository";
import { announcementRepository } from "../../../../repositories/announcement.repository";
import { heroSectionRepository } from "../../../../repositories/hero-section.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { connectDB } from "../../../../config/db";

const getRepository = (model: string): any => {
  switch (model) {
    case "pages": return pageRepository;
    case "blogs": return blogRepository;
    case "categories": return categoryRepository;
    case "authors": return authorRepository;
    case "faqs": return faqRepository;
    case "testimonials": return testimonialRepository;
    case "media": return mediaRepository;
    case "navigation": return navigationRepository;
    case "announcements": return announcementRepository;
    case "hero-sections": return heroSectionRepository;
    default: throw new Error("Invalid model");
  }
};

const getSearchableFields = (model: string): string[] => {
  switch (model) {
    case "pages": return ["title", "slug", "content"];
    case "blogs": return ["title", "slug", "content"];
    case "categories": return ["name", "slug", "description"];
    case "authors": return ["name", "bio"];
    case "faqs": return ["question", "answer", "category"];
    case "testimonials": return ["name", "designation", "company", "review"];
    case "media": return ["name", "mimeType", "altText", "caption"];
    case "navigation": return ["name"];
    case "announcements": return ["message"];
    case "hero-sections": return ["pageName", "title", "subtitle"];
    default: return [];
  }
};

const getPopulateOptions = (model: string): string[] => {
  if (model === "blogs") return ["category", "author"];
  return [];
};

export const GET = apiHandler(async (req: NextRequest, segmentData: any) => {
  await connectDB();
  const params = await segmentData.params;
  const { model } = params;
  const repo = getRepository(model);

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

  const searchableFields = getSearchableFields(model);
  const populate = getPopulateOptions(model);

  const result = await repo.paginate(paginationInput, searchableFields, { populate });

  return NextResponse.json(
    ResponseHelper.success(`Fetched list from ${model} successfully`, result.data, result.meta),
    { status: 200 }
  );
});

export const POST = apiHandler(async (req: NextRequest, segmentData: any) => {
  await connectDB();
  const params = await segmentData.params;
  const { model } = params;
  const repo = getRepository(model);

  const body = await req.json();
  const result = await repo.create(body);

  return NextResponse.json(
    ResponseHelper.success(`Created item in ${model} successfully`, result),
    { status: 201 }
  );
});
