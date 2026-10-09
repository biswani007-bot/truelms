/* eslint-disable @typescript-eslint/no-explicit-any */
import { workflowExecutionRepository } from "../../repositories/workflow-execution.repository";
import { WorkflowExecution } from "../../models/workflow-execution.model";
import { WorkflowExecutionLog } from "../../models/workflow-execution-log.model";
import { ConditionService } from "./condition.service";
import { ActionService } from "./action.service";
import { PaginationInput } from "../../dtos/pagination.dto";
import { workflowExecutionLogRepository } from "../../repositories/workflow-execution-log.repository";

export class ExecutionService {
  static async listExecutions(paginationInput: PaginationInput) {
    return workflowExecutionRepository.paginate(
      paginationInput,
      ["status", "triggerEvent"],
      { populate: ["workflow"] }
    );
  }

  static async listExecutionLogs(paginationInput: PaginationInput) {
    return workflowExecutionLogRepository.paginate(
      paginationInput,
      ["step", "status"],
      { populate: ["execution"] }
    );
  }

  static async findExecution(id: string) {
    return workflowExecutionRepository.findById(id, { populate: ["workflow"] });
  }

  /**
   * Spawns a pipeline run context, evaluates conditions, and executes actions sequentially
   */
  static async executeWorkflow(workflow: any, triggerEvent: string, context: Record<string, unknown>): Promise<boolean> {
    const startTime = Date.now();

    const execution = await WorkflowExecution.create({
      workflow: workflow._id,
      triggerEvent,
      context,
      status: "running",
      startedAt: new Date(),
    });

    const executionId = execution._id.toString();

    try {
      await ExecutionService.logStep(executionId, "Trigger Evaluation", "info", `Trigger matched event type: ${triggerEvent}`);

      // Evaluate conditions
      let conditionsMet = true;
      if (workflow.conditions) {
        conditionsMet = ConditionService.evaluate(workflow.conditions, context);
      }

      if (!conditionsMet) {
        await ExecutionService.logStep(
          executionId,
          "Condition Verification",
          "warn",
          "Conditions check failed. Workflow execution skipped."
        );

        await workflowExecutionRepository.update(executionId, {
          status: "skipped",
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
        } as any);

        return false;
      }

      await ExecutionService.logStep(executionId, "Condition Verification", "success", "Conditions check successfully passed.");

      // Run action pipeline sequentially
      const sortedActions = [...workflow.actions].sort((a, b) => a.order - b.order);

      for (const action of sortedActions) {
        await ExecutionService.logStep(
          executionId,
          `Action: ${action.type}`,
          "info",
          `Initiating step execution for action type: ${action.type}`
        );

        await ActionService.executeAction(action, context);

        await ExecutionService.logStep(
          executionId,
          `Action: ${action.type}`,
          "success",
          `Step execution successfully completed for action: ${action.type}`
        );
      }

      await workflowExecutionRepository.update(executionId, {
        status: "completed",
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      } as any);

      await ExecutionService.logStep(executionId, "Pipeline Completion", "success", "Workflow execution completed successfully.");
      return true;
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error occurred";
      await ExecutionService.logStep(executionId, "Pipeline Execution Failure", "error", errorMsg);

      await workflowExecutionRepository.update(executionId, {
        status: "failed",
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      } as any);

      return false;
    }
  }

  private static async logStep(executionId: string, step: string, status: "info" | "success" | "warn" | "error", message: string) {
    return WorkflowExecutionLog.create({
      execution: executionId as any,
      step,
      status,
      message,
      timestamp: new Date(),
    });
  }
}
