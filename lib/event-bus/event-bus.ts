import { logger } from "../../utils/logger";

export type EventHandler<T = Record<string, unknown>> = (payload: T, metadata: EventMetadata) => Promise<void> | void;

export interface EventMetadata {
  eventName: string;
  timestamp: Date;
  correlationId: string;
}

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<EventHandler>> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Register a callback subscriber handler for a specific eventName
   */
  subscribe(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
    logger.info({ eventName }, `[EventBus] Subscriber registered for event: ${eventName}`);
  }

  /**
   * Unsubscribe a registered callback handler
   */
  unsubscribe(eventName: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      if (eventHandlers.size === 0) {
        this.handlers.delete(eventName);
      }
      logger.info({ eventName }, `[EventBus] Subscriber removed for event: ${eventName}`);
    }
  }

  /**
   * Publish a payload asynchronously to all matching subscribers
   */
  async publish(eventName: string, payload: Record<string, unknown>, correlationId?: string): Promise<void> {
    const cid = correlationId || `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const metadata: EventMetadata = {
      eventName,
      timestamp: new Date(),
      correlationId: cid,
    };

    logger.info({ eventName, correlationId: cid, payload }, `[EventBus] Publishing event: ${eventName}`);

    const eventHandlers = this.handlers.get(eventName);
    if (!eventHandlers || eventHandlers.size === 0) {
      logger.debug({ eventName }, `[EventBus] No subscribers found for event: ${eventName}`);
      return;
    }

    // Trigger handlers asynchronously
    for (const handler of eventHandlers) {
      Promise.resolve()
        .then(() => handler(payload, metadata))
        .catch(err => {
          logger.error(
            { eventName, correlationId: cid, error: err.message || err },
            `[EventBus] Error occurred in handler execution for event: ${eventName}`
          );
        });
    }
  }
}

export const eventBus = EventBus.getInstance();
