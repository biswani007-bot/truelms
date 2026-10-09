
/**
 * @swagger
 * /api/admin/cms/pages/bulk:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/cms/pages/bulk
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
import { Page } from "../../../../../../models/page.model";

export const POST = withRoles(
  ["Admin", "Super Admin", "academic-manager", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const { ids, action, payload } = await req.json();

      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ success: false, error: "No ids provided" }, { status: 400 });
      }

      let updateQuery: any = {};
      
      switch (action) {
        case "publish":
          updateQuery = { status: "PUBLISHED", publishedDate: new Date() };
          break;
        case "archive":
          updateQuery = { status: "ARCHIVED" };
          break;
        case "delete":
          updateQuery = { isDeleted: true, status: "ARCHIVED" };
          break;
        case "draft":
          updateQuery = { status: "DRAFT" };
          break;
        case "update_author":
          if (!payload?.authorId) throw new Error("Missing authorId payload");
          updateQuery = { author: payload.authorId };
          break;
        default:
          return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
      }

      const result = await Page.updateMany(
        { _id: { $in: ids } },
        { $set: updateQuery }
      );

      return NextResponse.json({ success: true, data: { modifiedCount: result.modifiedCount } });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);
