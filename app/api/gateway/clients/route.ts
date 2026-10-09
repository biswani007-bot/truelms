
/**
 * @swagger
 * /api/gateway/clients:
 *   post:
 *     summary: Auto-generated summary for POST /api/gateway/clients
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
 * /api/gateway/clients:
 *   get:
 *     summary: Auto-generated summary for GET /api/gateway/clients
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
import { apiClientRepository } from "../../../../repositories/api-client.repository";
import { ApiClient } from "../../../../models/api-client.model";

export const GET = withRoles(
  ["super-admin", "admin", "api-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const params = PaginationSchema.parse(Object.fromEntries(searchParams));
    const result = await apiClientRepository.paginate(params, ["name", "status"]);
    return NextResponse.json(ResponseHelper.success("API Clients fetched", result));
  }
);

export const POST = withRoles(
  ["super-admin", "admin", "api-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    const client = await ApiClient.create(body);
    return NextResponse.json(ResponseHelper.success("API Client created", client), { status: 201 });
  }
);
