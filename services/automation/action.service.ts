/* eslint-disable @typescript-eslint/no-explicit-any */
import { IWorkflowAction } from "../../models/workflow-action.model";
import { NotificationService } from "../notification/notification.service";
import { logger } from "../../utils/logger";

export class ActionService {
  /**
   * Execute an individual action step using configured properties and payload context
   */
  static async executeAction(action: IWorkflowAction, context: Record<string, unknown>): Promise<void> {
    const { type, config } = action;

    logger.info({ type, config }, `[ActionService] Executing workflow action step: ${type}`);

    switch (type) {
      case "send-notification": {
        const { recipientId, templateSlug, eventSource } = config as any;
        if (!recipientId || !templateSlug || !eventSource) {
          throw new Error("Missing notification config parameters: recipientId, templateSlug, or eventSource");
        }

        // Resolve recipient ID if specified dynamically from context
        const resolvedRecipient = ActionService.resolveDynamicKey(recipientId, context) || recipientId;

        await NotificationService.sendNotification(
          resolvedRecipient,
          templateSlug,
          eventSource,
          context
        );
        break;
      }

      case "create-task":
        logger.info(config, "[ActionService] [Task Adapter] Stub task creation triggered successfully.");
        break;

      case "update-status":
        logger.info(config, "[ActionService] [Status Adapter] Stub status updates modified successfully.");
        break;

      case "generate-snapshot":
        logger.info(config, "[ActionService] [Snapshot Adapter] Stub report snapshot generation initiated.");
        break;

      case "queue-approval":
        logger.info(config, "[ActionService] [Approval Adapter] Stub approval requests queued.");
        break;

      case "run-script":
        logger.info(config, "[ActionService] [Script Adapter] Stub execution context run.");
        break;

      default:
        throw new Error(`Unsupported workflow action type: ${type}`);
    }
  }

  private static resolveDynamicKey(pathKey: string, obj: Record<string, unknown>): string | undefined {
    if (!pathKey.startsWith("context.")) return undefined;
    const cleanPath = pathKey.replace("context.", "");
    return cleanPath.split(".").reduce((curr: any, part: string) => {
      return curr ? curr[part] : undefined;
    }, obj);
  }
}
