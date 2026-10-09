
/**
 * @swagger
 * /api/admin/cms/blogs/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/admin/cms/blogs/{id}
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
 * /api/admin/cms/blogs/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/admin/cms/blogs/{id}
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
 * /api/admin/cms/blogs/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/cms/blogs/{id}
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
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { connectDB } from "../../../../../../config/db";
import { blogRepository } from "../../../../../../repositories/blog.repository";

export const GET = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      await connectDB();
      const resolvedParams = await params;
      const blog = await blogRepository.findById(resolvedParams.id, {
        populate: [
          { path: "author", select: "name avatar" },
          { path: "category", select: "name slug" }
        ]
      });

      if (!blog) {
        return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: blog });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);

export const PUT = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      await connectDB();
      const resolvedParams = await params;
      const data = await req.json();

      const existingBlog = await blogRepository.findById(resolvedParams.id);
      if (!existingBlog) {
        return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
      }

      // Handle versioning history
      const currentVersion = existingBlog.versionHistory || [];
      const userId = req.headers.get("x-user-id");

      if (data.content && data.content !== existingBlog.content) {
        currentVersion.push({
          version: currentVersion.length + 1,
          content: existingBlog.content,
          updatedBy: (userId || existingBlog.author) as any,
          updatedAt: new Date()
        });
        data.versionHistory = currentVersion as any;
      }

      const updatedBlog = await blogRepository.update(resolvedParams.id, data);
      return NextResponse.json({ success: true, data: updatedBlog });
    } catch (error: any) {
      if (error.code === 11000) {
        return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);

export const DELETE = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      await connectDB();
      const resolvedParams = await params;
      await blogRepository.softDelete(resolvedParams.id);
      return NextResponse.json({ success: true, data: { id: resolvedParams.id } });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);
