
/**
 * @swagger
 * /api/certificates/{id}/generate:
 *   post:
 *     summary: Auto-generated summary for POST /api/certificates/{id}/generate
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
  params: Promise<{ id: string }>; // eligibilityId here
}

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const { templateCode } = await req.json();

    if (!templateCode) {
      return NextResponse.json(ResponseHelper.error("templateCode is required"), { status: 400 });
    }

    const cert = await CertificateService.generateCertificateDraft(id, templateCode, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Certificate draft generated successfully", cert), { status: 201 });
  })
);
