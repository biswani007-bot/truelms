/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ReportSchedulerService
 *
 * Manages scheduling METADATA only.
 * Does NOT execute cron jobs or background tasks.
 */
import { reportScheduleRepository } from "../../repositories/report-schedule.repository";
import { reportDefinitionRepository } from "../../repositories/report-definition.repository";
import { ReportSchedule } from "../../models/report-schedule.model";
import { PaginationInput } from "../../dtos/pagination.dto";

export class ReportSchedulerService {
  static async listSchedules(paginationInput: PaginationInput) {
    return reportScheduleRepository.paginate(
      paginationInput,
      [],
      { populate: ["reportDefinition", "createdBy"] }
    );
  }

  static async findSchedule(id: string) {
    return reportScheduleRepository.findById(id, { populate: ["reportDefinition"] });
  }

  static async createSchedule(data: {
    reportDefinitionId: string;
    frequency: string;
    recipients: string[];
    filters?: Record<string, unknown>;
    notes?: string;
  }, userId?: string) {
    const def = await reportDefinitionRepository.findById(data.reportDefinitionId);
    if (!def) throw new Error("Report definition not found");

    // Compute nextRunAt based on frequency
    const nextRunAt = ReportSchedulerService.computeNextRun(data.frequency);

    const schedule = await ReportSchedule.create({
      reportDefinition: data.reportDefinitionId as any,
      frequency: data.frequency,
      recipients: data.recipients,
      filters: data.filters,
      notes: data.notes,
      isActive: true,
      nextRunAt,
      createdBy: userId as any,
    });

    // Mark definition as scheduled
    await reportDefinitionRepository.update(data.reportDefinitionId, {
      isScheduled: true,
    } as any);

    return schedule;
  }

  static async updateSchedule(id: string, data: Partial<{
    frequency: string;
    recipients: string[];
    filters: Record<string, unknown>;
    isActive: boolean;
    notes: string;
  }>) {
    const schedule = await reportScheduleRepository.findById(id);
    if (!schedule) throw new Error("Schedule not found");

    const updates: any = { ...data };
    if (data.frequency) {
      updates.nextRunAt = ReportSchedulerService.computeNextRun(data.frequency);
    }

    return reportScheduleRepository.update(id, updates);
  }

  static async deactivateSchedule(id: string) {
    const schedule = await reportScheduleRepository.findById(id);
    if (!schedule) throw new Error("Schedule not found");
    return reportScheduleRepository.update(id, { isActive: false } as any);
  }

  static async deleteSchedule(id: string) {
    return reportScheduleRepository.softDelete(id);
  }

  /**
   * Compute the next run date based on frequency.
   * This is metadata only — no actual scheduling happens.
   */
  private static computeNextRun(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case "daily":
        now.setDate(now.getDate() + 1);
        break;
      case "weekly":
        now.setDate(now.getDate() + 7);
        break;
      case "monthly":
        now.setMonth(now.getMonth() + 1);
        break;
      case "quarterly":
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }
    return now;
  }
}
