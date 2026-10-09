
/**
 * @swagger
 * /api/admin/cms/media:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/cms/media
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
 * /api/admin/cms/media:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/cms/media
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
import { mediaRepository } from "../../../../../repositories/media.repository";
import { Media } from "../../../../../models/media.model";

export const GET = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const { searchParams } = req.nextUrl;
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "24");
      const search = searchParams.get("search") || "";
      const sort = searchParams.get("sort") || "createdAt";
      const order = searchParams.get("order") as "asc" | "desc" || "desc";
      const folder = searchParams.get("folder");

      let filters: any = {};
      if (folder) {
        filters.folder = folder;
      }
      
      const filterStr = searchParams.get("filters");
      if (filterStr) {
        try {
          filters = { ...filters, ...JSON.parse(decodeURIComponent(filterStr)) };
        } catch (e) {}
      }

      // Quick endpoint specific to finding unused media
      if (searchParams.get("unused") === "true") {
        filters.usageCount = 0;
      }

      const result = await mediaRepository.paginate(
        { page, limit, search, sort, order, filters },
        ["name", "altText", "caption"]
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
      
      // In a real application, we would use a form-data parser (like multiparty or Next.js native FormData) 
      // and upload to AWS S3/Cloudinary. Here we mock the result to keep it self-contained for the UI demo.
      // E.g., const formData = await req.formData();
      // const file = formData.get("file") as File;
      
      const data = await req.json(); // Receiving metadata for now
      
      if (!data.name || !data.url || !data.mimeType || !data.size) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      const newMedia = await mediaRepository.create(data);
      return NextResponse.json({ success: true, data: newMedia });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);
