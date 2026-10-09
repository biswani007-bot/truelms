import { CertificateEligibility, ICertificateEligibility } from "../models/certificate-eligibility.model";
import { BaseRepository } from "./base.repository";

class CertificateEligibilityRepository extends BaseRepository<ICertificateEligibility> {
  constructor() {
    super(CertificateEligibility);
  }
}

export const certificateEligibilityRepository = new CertificateEligibilityRepository();
