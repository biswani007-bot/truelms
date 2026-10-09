
/**
 * @swagger
 * /api/certificates/{id}/revoke:
 *   post:
 *     summary: Auto-generated summary for POST /api/certificates/{id}/revoke
 *     tags: [certificates]
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { CertificateService } from "../../../../../services/certificate/certificate.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const { remarks } = await req.json();

    if (!remarks) {
      return NextResponse.json(ResponseHelper.error("Remarks explanation is required for revocation"), { status: 400 });
    }

    const updated = await CertificateService.revokeCertificate(id, remarks, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Certificate revoked successfully", updated), { status: 200 });
  })
);
