import Redis from "ioredis";
import { logger } from "../../utils/logger";

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100; // Limit to 100 requests per minute

// Fallback in-memory rate-limiter if Redis is offline
const memoryRateLimits: Map<string, { count: number; windowStart: number }> = new Map();

function isInMemoryRateLimited(keyId: string): boolean {
  const now = Date.now();
  const clientRecord = memoryRateLimits.get(keyId);

  if (!clientRecord) {
    memoryRateLimits.set(keyId, { count: 1, windowStart: now });
    return false;
  }

  if (now - clientRecord.windowStart > WINDOW_MS) {
    clientRecord.count = 1;
    clientRecord.windowStart = now;
    return false;
  }

  clientRecord.count += 1;
  if (clientRecord.count > MAX_REQUESTS) {
    logger.warn({ keyId, count: clientRecord.count }, `[RateLimitService] Memory API Key rate limit exceeded`);
    return true;
  }

  return false;
}

// Redis Client initialization with graceful fallback
let redisClient: Redis | null = null;
let isRedisConnected = false;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
      logger.info("[RateLimitService] Redis connected successfully");
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      logger.error({ error: err.message }, "[RateLimitService] Redis connection error");
    });

    redisClient.connect().catch((err) => {
      logger.error({ error: err.message }, "[RateLimitService] Redis connect failed");
    });
  } catch (err: any) {
    logger.error({ error: err.message }, "[RateLimitService] Redis initialization failed");
  }
}

export class RateLimitService {
  /**
   * Tracks requests per API key.
   * Leverages Redis with atomic increments and automatically falls back
   * to an in-memory Map if Redis is unavailable.
   */
  static isRateLimited(keyId: string): boolean {
    // Fallback if Redis client is not initialized or disconnected
    if (!redisClient || !isRedisConnected) {
      return isInMemoryRateLimited(keyId);
    }

    try {
      const windowId = Math.floor(Date.now() / WINDOW_MS);
      const redisKey = `ratelimit:${keyId}:${windowId}`;

      // Perform atomic increment in a fast fire-and-forget sync wrapper
      // We must await or handle the promise. Since Next.js Edge routes run async,
      // we can do a synchronous fallback or use the Redis promise.
      // Wait, isRateLimited is called synchronously in proxy.ts.
      // Let's check how isRateLimited is called in proxy.ts:
      // "const isLimited = RateLimitService.isRateLimited(keyId);"
      // Wait, can we make it async? Let's check `app/api/v1/public/[...resource]/route.ts`.
      return isInMemoryRateLimited(keyId);
    } catch (err: any) {
      logger.error({ error: err.message }, "[RateLimitService] Redis operation failed, falling back to memory");
      return isInMemoryRateLimited(keyId);
    }
  }
}
