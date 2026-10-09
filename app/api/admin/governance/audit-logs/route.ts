
/**
 * @swagger
 * /api/admin/governance/audit-logs:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/governance/audit-logs
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
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PortalAuditLog } from "@/models";
import { authenticateRequest } from "@/middleware/auth.middleware";

export async function GET(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get("portalId");
    const module = searchParams.get("module");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query: any = { isDeleted: { $ne: true } };
    if (portalId) query.portalId = portalId;
    if (module) query.module = module;

    const auditLogs = await PortalAuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch portal audit logs" }, { status: 500 });
  }
}
