/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { Certificate } from "../../../../../models/certificate.model";
import { TimelineService } from "../../../../../services/certificate/timeline.service";
import { EligibilityService } from "../../../../../services/certificate/eligibility.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Certificate Officer"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const cert = await Certificate.findById(id);
    if (!cert) {
      return NextResponse.json(ResponseHelper.error("Certificate not found"), { status: 404 });
    }

    if (cert.status === "revoked") {
      return NextResponse.json(
        ResponseHelper.error("Cannot issue a revoked certificate"),
        { status: 422 }
      );
    }

    if (cert.status === "issued") {
      return NextResponse.json(ResponseHelper.success("Certificate is already issued", cert), { status: 200 });
    }

    // Authoritative check: Recalculate eligibility with current configured rules
    if (cert.enrollment) {
      const el = await EligibilityService.calculateEligibility(cert.enrollment.toString());
      if (!el || !el.isEligible) {
        return NextResponse.json(
          ResponseHelper.error(
            "Academic integrity violation: Cannot issue certificate for an ineligible student. Student does not satisfy current certificate eligibility criteria."
          ),
          { status: 422 }
        );
      }
    }

    const updated = await Certificate.findByIdAndUpdate(
      id,
      { status: "issued", issueDate: new Date(), issuedBy: userContext.userId as any, approvedBy: userContext.userId as any },
      { new: true }
    );

    const { CertificateApproval } = await import("../../../../../models/certificate-approval.model");
    await CertificateApproval.findOneAndUpdate(
      { certificate: id },
      { status: "approved", approvedBy: userContext.userId as any }
    );

    await TimelineService.logEvent(
      id,
      "issued",
      "Digital certificate credential successfully issued after eligibility verification",
      userContext.userId
    );

    return NextResponse.json(ResponseHelper.success("Certificate issued successfully", updated), { status: 200 });
  })
);
