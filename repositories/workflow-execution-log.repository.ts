import { WorkflowExecutionLog, IWorkflowExecutionLog } from "../models/workflow-execution-log.model";
import { BaseRepository } from "./base.repository";

class WorkflowExecutionLogRepository extends BaseRepository<IWorkflowExecutionLog> {
  constructor() {
    super(WorkflowExecutionLog);
  }
}

export const workflowExecutionLogRepository = new WorkflowExecutionLogRepository();
