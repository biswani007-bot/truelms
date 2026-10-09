/* eslint-disable @typescript-eslint/no-explicit-any */
import { certificateTemplateRepository } from "../../repositories/certificate-template.repository";

export class TemplateService {
  static async createTemplate(data: any) {
    return certificateTemplateRepository.create(data);
  }
}
