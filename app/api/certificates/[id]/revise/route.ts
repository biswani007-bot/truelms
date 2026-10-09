/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "@/middleware/auth.middleware";
import { ResponseHelper } from "@/helpers/response";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";
import { CertificateService } from "@/services/certificate/certificate.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const reason = body.reason;
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        ResponseHelper.error("A revision reason is required to revise and reissue a certificate."),
        { status: 400 }
      );
    }

    try {
      const newDraft = await CertificateService.reviseAndReissue(
        id,
        reason.trim(),
        body.customization || {},
        userContext.userId
      );

      return NextResponse.json(
        ResponseHelper.success("Certificate revision draft created successfully", newDraft),
        { status: 201 }
      );
    } catch (error: any) {
      return NextResponse.json(
        ResponseHelper.error(error.message || "Failed to process certificate revision"),
        { status: 422 }
      );
    }
  })
);
