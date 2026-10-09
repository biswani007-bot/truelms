import { CertificateVerification, ICertificateVerification } from "../models/certificate-verification.model";
import { BaseRepository } from "./base.repository";

class CertificateVerificationRepository extends BaseRepository<ICertificateVerification> {
  constructor() {
    super(CertificateVerification);
  }
}

export const certificateVerificationRepository = new CertificateVerificationRepository();
