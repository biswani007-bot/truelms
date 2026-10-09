import { Certificate, ICertificate } from "../models/certificate.model";
import { BaseRepository } from "./base.repository";

class CertificateRepository extends BaseRepository<ICertificate> {
  constructor() {
    super(Certificate);
  }
}

export const certificateRepository = new CertificateRepository();
