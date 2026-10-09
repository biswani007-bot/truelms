/* eslint-disable @typescript-eslint/no-explicit-any */
import { workflowTemplateRepository } from "../../repositories/workflow-template.repository";
import { WorkflowTemplate } from "../../models/workflow-template.model";
import { PaginationInput } from "../../dtos/pagination.dto";

export class TemplateService {
  static async listTemplates(paginationInput: PaginationInput) {
    return workflowTemplateRepository.paginate(
      paginationInput,
      ["name", "category", "triggerType"]
    );
  }

  static async findTemplate(id: string) {
    return workflowTemplateRepository.findById(id);
  }

  static async createTemplate(data: {
    name: string;
    description?: string;
    triggerType: string;
    actions: any[];
    category: string;
  }) {
    return WorkflowTemplate.create(data);
  }

  static async updateTemplate(id: string, data: Partial<{
    name: string;
    description: string;
    triggerType: string;
    actions: any[];
    category: string;
  }>) {
    const template = await workflowTemplateRepository.findById(id);
    if (!template) throw new Error("Template not found");
    return workflowTemplateRepository.update(id, data as any);
  }

  static async deleteTemplate(id: string) {
    return workflowTemplateRepository.softDelete(id);
  }
}
