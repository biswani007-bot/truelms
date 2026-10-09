
/**
 * @swagger
 * /api/admin/cms/navigation:
 *   put:
 *     summary: Auto-generated summary for PUT /api/admin/cms/navigation
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
 * /api/admin/cms/navigation:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/cms/navigation
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
import { navigationRepository } from "../../../../../repositories/navigation.repository";

export const GET = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const { searchParams } = req.nextUrl;
      const name = searchParams.get("name");

      if (name) {
        const nav = await navigationRepository.findOne({ name });
        return NextResponse.json({ success: true, data: nav || { name, items: [] } });
      }

      const allNavs = await navigationRepository.findMany();
      return NextResponse.json({ success: true, data: allNavs });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);

export const PUT = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const data = await req.json();

      if (!data.name || !Array.isArray(data.items)) {
        return NextResponse.json({ success: false, error: "Invalid payload format" }, { status: 400 });
      }

      // Upsert navigation by name
      const existingNav = await navigationRepository.findOne({ name: data.name });
      let updatedNav;
      
      if (existingNav) {
        updatedNav = await navigationRepository.update(existingNav._id.toString(), { items: data.items });
      } else {
        updatedNav = await navigationRepository.create(data);
      }

      return NextResponse.json({ success: true, data: updatedNav });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);
