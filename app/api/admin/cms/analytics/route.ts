
/**
 * @swagger
 * /api/admin/cms/analytics:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/cms/analytics
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
import { Page } from "../../../../../models/page.model";
import { Blog } from "../../../../../models/blog.model";
import { Media } from "../../../../../models/media.model";

export const GET = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();

      // Aggregate page statuses
      const pageStats = await Page.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      // Aggregate blog statuses
      const blogStats = await Blog.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      // Aggregate media usage
      const mediaStats = await Media.aggregate([
        { $group: { _id: null, totalSize: { $sum: "$size" }, totalFiles: { $sum: 1 } } }
      ]);
      const unusedMediaCount = await Media.countDocuments({ usageCount: 0 });

      // Calculate totals
      const totalPages = pageStats.reduce((acc, curr) => acc + curr.count, 0);
      const totalBlogs = blogStats.reduce((acc, curr) => acc + curr.count, 0);

      // Extract scheduled/draft specifically
      const pagesScheduled = pageStats.find(s => s._id === "SCHEDULED")?.count || 0;
      const blogsScheduled = blogStats.find(s => s._id === "SCHEDULED")?.count || 0;
      const pagesDrafts = pageStats.find(s => s._id === "DRAFT")?.count || 0;
      const blogsDrafts = blogStats.find(s => s._id === "DRAFT")?.count || 0;
      
      const publishedPages = pageStats.find(s => s._id === "PUBLISHED")?.count || 0;
      const publishedBlogs = blogStats.find(s => s._id === "PUBLISHED")?.count || 0;

      return NextResponse.json({
        success: true,
        data: {
          content: {
            totalPages,
            publishedPages,
            draftPages: pagesDrafts,
            scheduledPages: pagesScheduled,
            totalBlogs,
            publishedBlogs,
            draftBlogs: blogsDrafts,
            scheduledBlogs: blogsScheduled,
          },
          media: {
            totalFiles: mediaStats[0]?.totalFiles || 0,
            totalSizeBytes: mediaStats[0]?.totalSize || 0,
            unusedFiles: unusedMediaCount,
          }
        }
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);
