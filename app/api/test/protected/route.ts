
/**
 * @swagger
 * /api/test/protected:
 *   post:
 *     summary: Auto-generated summary for POST /api/test/protected
 *     tags: [test]
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
 * /api/test/protected:
 *   get:
 *     summary: Auto-generated summary for GET /api/test/protected
 *     tags: [test]
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
import { withRoles, withPermissions } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";

// A route protected by a specific role
export const GET = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, user) => {
    return NextResponse.json(
      ResponseHelper.success("You have accessed an Admin-only route!", { user }),
      { status: 200 }
    );
  })
);

// A route protected by a specific permission
export const POST = withPermissions(
  ["manage:courses"],
  apiHandler(async (req: NextRequest, user) => {
    return NextResponse.json(
      ResponseHelper.success("You have permission to manage courses!", { user }),
      { status: 200 }
    );
  })
);
