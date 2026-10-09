import { WorkflowExecution, IWorkflowExecution } from "../models/workflow-execution.model";
import { BaseRepository } from "./base.repository";

class WorkflowExecutionRepository extends BaseRepository<IWorkflowExecution> {
  constructor() {
    super(WorkflowExecution);
  }
}

export const workflowExecutionRepository = new WorkflowExecutionRepository();
