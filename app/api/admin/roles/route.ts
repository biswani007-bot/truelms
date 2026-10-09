
/**
 * @swagger
 * /api/admin/roles:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/roles
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
 * /api/admin/roles:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/roles
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
import { connectDB } from "../../../../config/db";
import { roleRepository } from "../../../../repositories/role.repository";

export async function GET() {
  try {
    await connectDB();
    const roles = await roleRepository.findMany({});
    return NextResponse.json({ success: true, data: roles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const role = await roleRepository.create(body);
    return NextResponse.json({ success: true, data: role });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
