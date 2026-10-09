/* eslint-disable @typescript-eslint/no-explicit-any */
import { workflowRepository } from "../../repositories/workflow.repository";
import { Workflow } from "../../models/workflow.model";
import { TriggerService } from "./trigger.service";
import { PaginationInput } from "../../dtos/pagination.dto";

export class WorkflowService {
  static async listWorkflows(paginationInput: PaginationInput) {
    return workflowRepository.paginate(
      paginationInput,
      ["name", "status", "trigger.type"],
      { populate: ["owner"] }
    );
  }

  static async findWorkflow(id: string) {
    return workflowRepository.findById(id, { populate: ["owner"] });
  }

  static async createWorkflow(data: {
    name: string;
    description?: string;
    trigger: { type: string; config?: Record<string, unknown> };
    conditions?: any;
    actions: any[];
  }, userId?: string) {
    const workflow = await Workflow.create({
      ...data,
      status: "draft",
      version: 1,
      owner: userId as any,
    });

    // Make sure TriggerService registers interest in EventBus for this trigger type
    TriggerService.registerEventListener(data.trigger.type);

    return workflow;
  }

  static async updateWorkflow(id: string, data: Partial<{
    name: string;
    description: string;
    trigger: { type: string; config?: Record<string, unknown> };
    conditions: any;
    actions: any[];
  }>) {
    const wf = await workflowRepository.findById(id);
    if (!wf) throw new Error("Workflow not found");

    const updated = await workflowRepository.update(id, {
      ...data,
      version: (wf.version || 1) + 1,
    } as any);

    if (data.trigger?.type) {
      TriggerService.registerEventListener(data.trigger.type);
    }

    return updated;
  }

  static async activate(id: string) {
    const wf = await workflowRepository.findById(id);
    if (!wf) throw new Error("Workflow not found");

    // Register listener on event bus if not registered
    TriggerService.registerEventListener(wf.trigger.type);

    return workflowRepository.update(id, { status: "active" } as any);
  }

  static async pause(id: string) {
    const wf = await workflowRepository.findById(id);
    if (!wf) throw new Error("Workflow not found");
    return workflowRepository.update(id, { status: "paused" } as any);
  }

  static async archive(id: string) {
    const wf = await workflowRepository.findById(id);
    if (!wf) throw new Error("Workflow not found");
    return workflowRepository.update(id, { status: "archived" } as any);
  }

  static async deleteWorkflow(id: string) {
    return workflowRepository.softDelete(id);
  }

  /**
   * Boot function called on application startup to register event bus listeners
   * for all currently active workflows.
   */
  static async initializeListeners() {
    const activeWorkflows = await workflowRepository.findMany({ status: "active" });
    for (const wf of activeWorkflows) {
      TriggerService.registerEventListener(wf.trigger.type);
    }
  }
}
