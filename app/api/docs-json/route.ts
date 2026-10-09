
/**
 * @swagger
 * /api/docs-json:
 *   get:
 *     summary: Auto-generated summary for GET /api/docs-json
 *     tags: [docs-json]
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
import { NextResponse } from 'next/server';
import { getApiDocs } from '../../../lib/swagger';

export async function GET() {
  const spec = await getApiDocs();
  return NextResponse.json(spec);
}
