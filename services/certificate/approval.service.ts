/* eslint-disable @typescript-eslint/no-explicit-any */
import { TimelineService } from "./timeline.service";
import { Certificate } from "../../models/certificate.model";
import { CertificateApproval } from "../../models/certificate-approval.model";

import { EligibilityService } from "./eligibility.service";

export class ApprovalService {
  static async approve(certificateId: string, reviewerId: string, remarks?: string) {
    const cert = await Certificate.findById(certificateId);
    if (!cert) throw new Error("Certificate not found");

    if (cert.enrollment) {
      const el = await EligibilityService.calculateEligibility(cert.enrollment.toString());
      if (!el || !el.isEligible) {
        throw new Error("Cannot approve certificate: Student does not satisfy current certificate eligibility criteria");
      }
    }

    const approval = await CertificateApproval.findOneAndUpdate(
      { certificate: certificateId as any },
      {
        $set: {
          status: "approved",
          remarks,
          approvedBy: reviewerId as any,
          actionedAt: new Date(),
        },
      },
      { new: true }
    );

    // Mark certificate as issued
    await Certificate.findByIdAndUpdate(certificateId, {
      status: "issued",
      approvedBy: reviewerId as any,
      issueDate: new Date(),
    });

    await TimelineService.logEvent(certificateId, "approved", "Certificate issue request approved by academic director", reviewerId);
    await TimelineService.logEvent(certificateId, "issued", "Digital certificate credential successfully issued", reviewerId);

    return approval;
  }

  static async reject(certificateId: string, reviewerId: string, remarks: string) {
    const approval = await CertificateApproval.findOneAndUpdate(
      { certificate: certificateId as any },
      {
        $set: {
          status: "rejected",
          remarks,
          approvedBy: reviewerId as any,
          actionedAt: new Date(),
        },
      },
      { new: true }
    );

    // Revert certificate to eligible
    await Certificate.findByIdAndUpdate(certificateId, { status: "eligible" });

    await TimelineService.logEvent(certificateId, "revoked", `Certificate issuance request rejected: ${remarks}`, reviewerId);

    return approval;
  }
}
