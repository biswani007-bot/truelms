/* eslint-disable @typescript-eslint/no-explicit-any */
import { certificateRepository } from "../../repositories/certificate.repository";
import { certificateVerificationRepository } from "../../repositories/certificate-verification.repository";
import { TimelineService } from "./timeline.service";

export class VerificationService {
  static async verifyCertificate(query: { certNo?: string; uuid?: string; code?: string }, ipAddress?: string, browserInfo?: string) {
    const filter: any = {};
    if (query.certNo) filter.certificateNumber = query.certNo;
    if (query.uuid) filter.certificateUuid = query.uuid;
    if (query.code) filter.verificationCode = query.code;

    if (Object.keys(filter).length === 0) {
      return { verified: false };
    }

    const certificate = await certificateRepository.findOne(filter, { populate: ["student", "course", "batch"] });
    if (!certificate) {
      return { verified: false };
    }

    if (certificate.status === "revoked") {
      await certificateVerificationRepository.create({
        certificate: certificate._id as any,
        ipAddress,
        browserInfo,
        verifiedAt: new Date(),
        status: "failed",
      });

      return {
        verified: false,
        status: "revoked",
        certificate,
        revocationRemarks: (certificate as any).revocationRemarks || "This certificate has been revoked.",
      };
    }

    if (certificate.status !== "issued") {
      return {
        verified: false,
        status: certificate.status,
        certificate,
      };
    }

    // Save verification log
    await certificateVerificationRepository.create({
      certificate: certificate._id as any,
      ipAddress,
      browserInfo,
      verifiedAt: new Date(),
      status: "success",
    });

    await TimelineService.logEvent(certificate._id.toString(), "verified", `Credential verified successfully from IP: ${ipAddress || "Unknown"}`);

    return { verified: true, status: "issued", certificate };
  }
}
