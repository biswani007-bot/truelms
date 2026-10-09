import { WorkflowTemplate, IWorkflowTemplate } from "../models/workflow-template.model";
import { BaseRepository } from "./base.repository";

class WorkflowTemplateRepository extends BaseRepository<IWorkflowTemplate> {
  constructor() {
    super(WorkflowTemplate);
  }
}

export const workflowTemplateRepository = new WorkflowTemplateRepository();
