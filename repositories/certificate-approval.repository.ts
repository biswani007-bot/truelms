import { CertificateApproval, ICertificateApproval } from "../models/certificate-approval.model";
import { BaseRepository } from "./base.repository";

class CertificateApprovalRepository extends BaseRepository<ICertificateApproval> {
  constructor() {
    super(CertificateApproval);
  }
}

export const certificateApprovalRepository = new CertificateApprovalRepository();
