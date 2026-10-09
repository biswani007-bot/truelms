
/**
 * @swagger
 * /api/admin/cms/pages:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/cms/pages
 *     tags: [admin]
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
 * /api/admin/cms/pages:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/cms/pages
 *     tags: [admin]
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
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { connectDB } from "../../../../../config/db";
import { pageRepository } from "../../../../../repositories/page.repository";

export const GET = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const { searchParams } = req.nextUrl;
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || "";
      const sort = searchParams.get("sort") || "createdAt";
      const order = searchParams.get("order") as "asc" | "desc" || "desc";
      const filterStr = searchParams.get("filters");

      let filters: any = {};
      if (filterStr) {
        try {
          filters = JSON.parse(decodeURIComponent(filterStr));
        } catch (e) {}
      }

      const result = await pageRepository.paginate(
        { page, limit, search, sort, order, filters },
        ["title", "slug"],
        { populate: [{ path: "author", select: "firstName lastName email" }] }
      );

      return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);

export const POST = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const data = await req.json();

      // Basic validation
      if (!data.title || !data.slug || !data.content) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      // Automatically assign author if not provided (mocking a bit since user context is usually in middleware)
      // Ideally req.user.id would be used here, assuming middleware passes it.
      const userId = req.headers.get("x-user-id");
      if (userId && !data.author) {
        data.author = userId;
      }

      const newPage = await pageRepository.create(data);
      return NextResponse.json({ success: true, data: newPage });
    } catch (error: any) {
      if (error.code === 11000) {
        return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);
