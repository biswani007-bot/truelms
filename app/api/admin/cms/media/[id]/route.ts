
/**
 * @swagger
 * /api/admin/cms/media/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/admin/cms/media/{id}
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
 * /api/admin/cms/media/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/admin/cms/media/{id}
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
 * /api/admin/cms/media/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/cms/media/{id}
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
import { mediaRepository } from "../../../../../../repositories/media.repository";

export const GET = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      await connectDB();
      const resolvedParams = await params;
      const media = await mediaRepository.findById(resolvedParams.id);

      if (!media) {
        return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: media });
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

      const existingMedia = await mediaRepository.findById(resolvedParams.id);
      if (!existingMedia) {
        return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
      }

      const updatedMedia = await mediaRepository.update(resolvedParams.id, data);
      return NextResponse.json({ success: true, data: updatedMedia });
    } catch (error: any) {
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
      await mediaRepository.softDelete(resolvedParams.id);
      return NextResponse.json({ success: true, data: { id: resolvedParams.id } });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);
