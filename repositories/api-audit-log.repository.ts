import { ApiAuditLog, IApiAuditLog } from "../models/api-audit-log.model";
import { BaseRepository } from "./base.repository";

class ApiAuditLogRepository extends BaseRepository<IApiAuditLog> {
  constructor() {
    super(ApiAuditLog);
  }
}

export const apiAuditLogRepository = new ApiAuditLogRepository();
