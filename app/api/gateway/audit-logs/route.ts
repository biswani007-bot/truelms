
/**
 * @swagger
 * /api/gateway/audit-logs:
 *   get:
 *     summary: Auto-generated summary for GET /api/gateway/audit-logs
 *     tags: [gateway]
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
import { ResponseHelper } from "../../../../helpers/response";
import { connectDB } from "../../../../config/db";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { ApiAuditService } from "../../../../services/gateway/api-audit.service";

export const GET = withRoles(
  ["super-admin", "admin", "api-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await ApiAuditService.listLogs(params);
    return NextResponse.json(ResponseHelper.success("API Audit logs fetched", result));
  }
);
