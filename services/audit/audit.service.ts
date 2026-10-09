import mongoose from "mongoose";
import { ActivityLog } from "../../models/activity-log.model";
import { logger } from "../../utils/logger";

export interface IAuditLogParams {
  userId?: string | mongoose.Types.ObjectId;
  role?: string;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Intercept and log critical administrative mutations safely (secrets omitted).
   */
  static async logMutation(params: IAuditLogParams): Promise<any> {
    const { userId, role, action, entity, entityId, ip, userAgent, metadata } = params;

    // Redact sensitive keys
    const safeMetadata = metadata ? { ...metadata } : {};
    delete safeMetadata.password;
    delete safeMetadata.token;
    delete safeMetadata.jwt;
    delete safeMetadata.secret;

    try {
      const log = await ActivityLog.create({
        user: userId ? new (mongoose.Types.ObjectId as any)(userId.toString()) : undefined,
        role,
        action,
        entity,
        entityId,
        ip,
        userAgent,
        metadata: safeMetadata,
        timestamp: new Date(),
      });

      logger.info({ action, entity, entityId }, `[AuditLog] Logged action ${action} on ${entity}`);
      return log;
    } catch (err: any) {
      logger.error(`[AuditLog] Failed to persist audit log: ${err.message}`);
      return null;
    }
  }
}
