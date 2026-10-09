/**
 * @swagger
 * /api/admin/security:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/security
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { connectDB } from "../../../../config/db";
import { activityLogRepository } from "../../../../repositories/activity-log.repository";

export const GET = withRoles(
  ["Admin", "Super Admin", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const { searchParams } = req.nextUrl;
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "50");
      const filterStr = searchParams.get("filter");
      
      let filter: any = {};
      if (filterStr) {
        try {
          filter = JSON.parse(decodeURIComponent(filterStr));
        } catch {
          // Ignore parse errors for simple usage
        }
      }

      if (filter.action && typeof filter.action === "string") {
        const escaped = filter.action
          .replace(/[-_]/g, " ")
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.action = { $regex: new RegExp(`^${escaped}$`, "i") };
      }

      if (filter.role && typeof filter.role === "string") {
        const escapedRole = filter.role.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.role = { $regex: new RegExp(`^${escapedRole}$`, "i") };
      }

      // Populate user field with role for UI display
      const result = await activityLogRepository.paginate(
        { page, limit, filters: filter, sort: "createdAt", order: "desc" },
        [],
        { populate: [{ path: "user", select: "firstName lastName email role" }] }
      );

      return NextResponse.json({
        success: true,
        data: {
          ...result,
          items: result.data,
        },
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
);
