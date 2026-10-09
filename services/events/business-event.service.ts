import mongoose from "mongoose";
import { BusinessEvent, IBusinessEvent } from "../../models/business-event.model";
import { JobEngineService } from "../jobs/job-engine.service";
import { logger } from "../../utils/logger";

export class BusinessEventService {
  /**
   * Publish a durable business event and enqueue its execution.
   */
  static async publishEvent(params: {
    eventType: string;
    entityType: string;
    entityId: string;
    payload: Record<string, any>;
    idempotencyKey: string;
  }): Promise<{ event: IBusinessEvent; isDuplicate: boolean }> {
    const { eventType, entityType, entityId, payload, idempotencyKey } = params;

    // Check idempotency
    const existing = await BusinessEvent.findOne({ idempotencyKey });
    if (existing) {
      logger.info(`[BusinessEvent] Duplicate event ignored for key: ${idempotencyKey}`);
      return { event: existing, isDuplicate: true };
    }

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const event = await BusinessEvent.create({
      eventId,
      eventType,
      entityType,
      entityId,
      payload,
      idempotencyKey,
      status: "pending",
      occurredAt: new Date(),
    });

    // Schedule background job to process the business event
    await JobEngineService.scheduleJob({
      jobType: `event.${eventType}`,
      entityType,
      entityId,
      payload: { eventId: event._id.toString(), ...payload },
      idempotencyKey: `job-${idempotencyKey}`,
      priority: "high",
    });

    logger.info(`[BusinessEvent] Published durable event: ${eventType} (${eventId})`);
    return { event, isDuplicate: false };
  }
}
