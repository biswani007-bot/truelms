import { CertificateTemplate, ICertificateTemplate } from "../models/certificate-template.model";
import { BaseRepository } from "./base.repository";

class CertificateTemplateRepository extends BaseRepository<ICertificateTemplate> {
  constructor() {
    super(CertificateTemplate);
  }
}

export const certificateTemplateRepository = new CertificateTemplateRepository();
