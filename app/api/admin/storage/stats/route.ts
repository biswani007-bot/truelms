
/**
 * @swagger
 * /api/admin/storage/stats:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/storage/stats
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
import { Media } from "../../../../../models/media.model";

export const GET = withRoles(
  ["Admin", "Super Admin", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      
      const totalStorageAggr = await Media.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: "$size" }, count: { $sum: 1 } } }
      ]);
      
      const typeBreakdownAggr = await Media.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$mimeType", totalSize: { $sum: "$size" }, count: { $sum: 1 } } },
        { $sort: { totalSize: -1 } }
      ]);

      const largestFiles = await Media.find({ isDeleted: false })
        .sort({ size: -1 })
        .limit(10)
        .select("name url mimeType size createdAt");

      return NextResponse.json({ 
        success: true, 
        data: {
          total: totalStorageAggr[0] || { totalSize: 0, count: 0 },
          breakdown: typeBreakdownAggr,
          largestFiles
        }
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
);
