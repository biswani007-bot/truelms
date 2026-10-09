/**
 * @swagger
 * /api/certificates/verify:
 *   get:
 *     summary: Auto-generated summary for GET /api/certificates/verify
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
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { VerificationService } from "../../../../services/certificate/verification.service";

// Public lookups do not require authentication or roles middleware!
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const url = new URL(req.url);

  const certNo = url.searchParams.get("certNo") || undefined;
  const uuid = url.searchParams.get("uuid") || undefined;
  const code = url.searchParams.get("code") || undefined;

  const result = await VerificationService.verifyCertificate(
    { certNo, uuid, code },
    req.headers.get("x-forwarded-for") || "127.0.0.1",
    req.headers.get("user-agent") || "Browser"
  );

  if (!(result as any).certificate) {
    return NextResponse.json(ResponseHelper.error("Certificate verification check failed. Credential not found."), { status: 404 });
  }

  if (!result.verified) {
    return NextResponse.json(
      ResponseHelper.success(
        (result as any).status === "revoked" ? "Certificate has been revoked" : "Certificate is not currently valid",
        result
      ),
      { status: 200 }
    );
  }

  return NextResponse.json(ResponseHelper.success("Certificate verified successfully", result), { status: 200 });
});
