
/**
 * @swagger
 * /api/admin/settings/validate:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/settings/validate
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
import { SettingsUpdateSchema } from "../../../../../dtos/settings.dto";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";

// POST Validate Settings
export const POST = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest) => {
    const body = await req.json();

    // DTO Validation
    SettingsUpdateSchema.parse(body);

    return NextResponse.json(
      ResponseHelper.success("Configuration payload is valid", { valid: true }),
      { status: 200 }
    );
  })
);
