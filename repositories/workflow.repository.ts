import { Workflow, IWorkflow } from "../models/workflow.model";
import { BaseRepository } from "./base.repository";

class WorkflowRepository extends BaseRepository<IWorkflow> {
  constructor() {
    super(Workflow);
  }
}

export const workflowRepository = new WorkflowRepository();
