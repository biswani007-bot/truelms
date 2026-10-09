
/**
 * @swagger
 * /api/gateway/keys:
 *   post:
 *     summary: Auto-generated summary for POST /api/gateway/keys
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

/**
 * @swagger
 * /api/gateway/keys:
 *   get:
 *     summary: Auto-generated summary for GET /api/gateway/keys
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
import { apiKeyRepository } from "../../../../repositories/api-key.repository";
import { ApiKeyService } from "../../../../services/gateway/api-key.service";

export const GET = withRoles(
  ["super-admin", "admin", "api-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await apiKeyRepository.paginate(params, ["status", "keyId"], { populate: ["apiClient"] });
    return NextResponse.json(ResponseHelper.success("API Keys fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin", "api-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    const result = await ApiKeyService.issueKey(body);
    return NextResponse.json(ResponseHelper.success("API Key issued successfully", result), { status: 201 });
  }
);
