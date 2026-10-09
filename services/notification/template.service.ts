/* eslint-disable @typescript-eslint/no-explicit-any */
import { notificationTemplateRepository } from "../../repositories/notification-template.repository";
import { NotificationTemplate } from "../../models/notification-template.model";
import { PaginationInput } from "../../dtos/pagination.dto";

export class TemplateService {
  static async listTemplates(paginationInput: PaginationInput) {
    return notificationTemplateRepository.paginate(
      paginationInput,
      ["name", "slug"]
    );
  }

  static async findTemplate(id: string) {
    return notificationTemplateRepository.findById(id);
  }

  static async findTemplateBySlug(slug: string) {
    return notificationTemplateRepository.findOne({ slug });
  }

  static async createTemplate(data: {
    name: string;
    slug: string;
    channels: string[];
    subjectTemplate?: string;
    bodyTemplate: string;
    variables?: string[];
    language?: string;
  }) {
    const existing = await notificationTemplateRepository.findOne({ slug: data.slug });
    if (existing) throw new Error(`Template with slug "${data.slug}" already exists`);

    return NotificationTemplate.create({
      ...data,
      version: 1,
    });
  }

  static async updateTemplate(id: string, data: Partial<{
    name: string;
    channels: string[];
    subjectTemplate: string;
    bodyTemplate: string;
    variables: string[];
    language: string;
  }>) {
    const template = await notificationTemplateRepository.findById(id);
    if (!template) throw new Error("Template not found");

    return notificationTemplateRepository.update(id, {
      ...data,
      version: (template.version || 1) + 1,
    } as any);
  }

  static async deleteTemplate(id: string) {
    return notificationTemplateRepository.softDelete(id);
  }

  /**
   * Replace template placeholder variables with real values
   */
  static render(templateStr: string, variables: Record<string, unknown>): string {
    let rendered = templateStr;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      rendered = rendered.replace(regex, String(value ?? ""));
    }
    return rendered;
  }
}
