
/**
 * @swagger
 * /api/cms/{model}/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/cms/{model}/{id}
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
 * /api/cms/{model}/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/cms/{model}/{id}
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
 * /api/cms/{model}/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/cms/{model}/{id}
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
import { pageRepository } from "../../../../../repositories/page.repository";
import { blogRepository } from "../../../../../repositories/blog.repository";
import { categoryRepository } from "../../../../../repositories/category.repository";
import { authorRepository } from "../../../../../repositories/author.repository";
import { faqRepository } from "../../../../../repositories/faq.repository";
import { testimonialRepository } from "../../../../../repositories/testimonial.repository";
import { mediaRepository } from "../../../../../repositories/media.repository";
import { navigationRepository } from "../../../../../repositories/navigation.repository";
import { announcementRepository } from "../../../../../repositories/announcement.repository";
import { heroSectionRepository } from "../../../../../repositories/hero-section.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

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

const getPopulateOptions = (model: string): string[] => {
  if (model === "blogs") return ["category", "author"];
  return [];
};

export const GET = apiHandler(async (req: NextRequest, segmentData: any) => {
  await connectDB();
  const params = await segmentData.params;
  const { model, id } = params;
  const repo = getRepository(model);
  const populate = getPopulateOptions(model);

  const result = await repo.findById(id, { populate });
  if (!result) {
    return NextResponse.json(
      ResponseHelper.error(`Item not found in ${model}`, "NOT_FOUND"),
      { status: 404 }
    );
  }

  return NextResponse.json(
    ResponseHelper.success(`Fetched item from ${model} successfully`, result),
    { status: 200 }
  );
});

export const PUT = apiHandler(async (req: NextRequest, segmentData: any) => {
  await connectDB();
  const params = await segmentData.params;
  const { model, id } = params;
  const repo = getRepository(model);
  const body = await req.json();

  const result = await repo.update(id, body);
  if (!result) {
    return NextResponse.json(
      ResponseHelper.error(`Item not found in ${model}`, "NOT_FOUND"),
      { status: 404 }
    );
  }

  return NextResponse.json(
    ResponseHelper.success(`Updated item in ${model} successfully`, result),
    { status: 200 }
  );
});

export const DELETE = apiHandler(async (req: NextRequest, segmentData: any) => {
  await connectDB();
  const params = await segmentData.params;
  const { model, id } = params;
  const repo = getRepository(model);

  const result = await repo.softDelete(id);
  if (!result) {
    return NextResponse.json(
      ResponseHelper.error(`Item not found in ${model}`, "NOT_FOUND"),
      { status: 404 }
    );
  }

  return NextResponse.json(
    ResponseHelper.success(`Deleted item from ${model} successfully`, result),
    { status: 200 }
  );
});
