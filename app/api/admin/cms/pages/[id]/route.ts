
/**
 * @swagger
 * /api/admin/cms/pages/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/admin/cms/pages/{id}
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
 * /api/admin/cms/pages/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/admin/cms/pages/{id}
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
 * /api/admin/cms/pages/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/cms/pages/{id}
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
import { pageRepository } from "../../../../../../repositories/page.repository";

export const GET = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      await connectDB();
      const resolvedParams = await params;
      const page = await pageRepository.findById(resolvedParams.id, {
        populate: [{ path: "author", select: "firstName lastName email" }]
      });

      if (!page) {
        return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: page });
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

      const existingPage = await pageRepository.findById(resolvedParams.id);
      if (!existingPage) {
        return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
      }

      // Handle versioning bump
      data.version = (existingPage.version || 1) + 1;
      // Note: A robust system would save version history here (like in Blogs)

      const updatedPage = await pageRepository.update(resolvedParams.id, data);
      return NextResponse.json({ success: true, data: updatedPage });
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
      await pageRepository.softDelete(resolvedParams.id);
      return NextResponse.json({ success: true, data: { id: resolvedParams.id } });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);
