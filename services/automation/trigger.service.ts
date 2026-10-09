/* eslint-disable @typescript-eslint/no-explicit-any */
import { eventBus } from "../../lib/event-bus/event-bus";
import { workflowRepository } from "../../repositories/workflow.repository";
import { ExecutionService } from "./execution.service";
import { logger } from "../../utils/logger";

export class TriggerService {
  private static registeredEvents: Set<string> = new Set();

  /**
   * Listen to the EventBus for a specific event type.
   * On event, finds active workflows with that trigger and executes them.
   */
  static registerEventListener(eventName: string) {
    if (TriggerService.registeredEvents.has(eventName)) return;

    eventBus.subscribe(eventName, async (payload, metadata) => {
      logger.info(
        { eventName, correlationId: metadata.correlationId },
        `[TriggerService] EventBus alert received, checking active workflows...`
      );

      // Find active workflows matching trigger type
      const workflows = await workflowRepository.findMany({
        status: "active",
        "trigger.type": eventName,
      });

      for (const wf of workflows) {
        // Run workflow execution asynchronously
        logger.info({ workflowId: wf._id, name: wf.name }, `[TriggerService] Launching matching workflow: ${wf.name}`);
        ExecutionService.executeWorkflow(wf, eventName, payload).catch(err => {
          logger.error({ workflowId: wf._id, error: err.message }, "[TriggerService] Error during workflow run");
        });
      }
    });

    TriggerService.registeredEvents.add(eventName);
    logger.info({ eventName }, `[TriggerService] EventBus listener registered for event type: ${eventName}`);
  }
}
