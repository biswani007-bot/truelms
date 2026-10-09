import { ApiAuditLog } from "../../models/api-audit-log.model";
import { apiAuditLogRepository } from "../../repositories/api-audit-log.repository";
import { PaginationInput } from "../../dtos/pagination.dto";

export class ApiAuditService {
  static async listLogs(paginationInput: PaginationInput) {
    return apiAuditLogRepository.paginate(
      paginationInput,
      ["action", "status", "ipAddress"],
      { populate: ["apiKey"] }
    );
  }

  static async logAccess(data: {
    apiKeyId?: string;
    ipAddress: string;
    userAgent?: string;
    action: string;
    status: string;
  }): Promise<void> {
    await ApiAuditLog.create({
      apiKey: data.apiKeyId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      action: data.action,
      status: data.status,
    });
  }
}
