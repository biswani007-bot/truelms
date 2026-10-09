/* eslint-disable @typescript-eslint/no-explicit-any */
import { studentRepository } from "../../repositories/student.repository";
import { teacherRepository } from "../../repositories/teacher.repository";
import { courseRepository } from "../../repositories/course.repository";
import { enrollmentRepository } from "../../repositories/enrollment.repository";
import { attendanceRepository } from "../../repositories/attendance.repository";
import { assignmentRepository } from "../../repositories/assignment.repository";
import { assessmentRepository } from "../../repositories/assessment.repository";
import { certificateRepository } from "../../repositories/certificate.repository";
import { invoiceRepository } from "../../repositories/invoice.repository";
import { notificationRepository } from "../../repositories/notification.repository";
import { reportDefinitionRepository } from "../../repositories/report-definition.repository";
import { logger } from "../../utils/logger";

const REPOSITORY_MAP: Record<string, any> = {
  students: studentRepository,
  teachers: teacherRepository,
  courses: courseRepository,
  enrollments: enrollmentRepository,
  attendance: attendanceRepository,
  assignments: assignmentRepository,
  assessments: assessmentRepository,
  certificates: certificateRepository,
  finance: invoiceRepository,
  notifications: notificationRepository,
  reports: reportDefinitionRepository,
};

export class ApiGatewayService {
  /**
   * Dispatches public gateway resource queries to the corresponding internal repository.
   */
  static async resolvePublicRoute(resource: string, queryParams: any): Promise<any> {
    const normalizedResource = resource.toLowerCase();
    const repo = REPOSITORY_MAP[normalizedResource];

    if (!repo) {
      throw new Error(`Public API resource endpoint not found for: ${resource}`);
    }

    logger.info({ resource: normalizedResource }, `[ApiGatewayService] Routing public request`);

    // Force read-only controls for reports, notifications, and finance parameters
    if (["finance", "notifications", "reports"].includes(normalizedResource) && queryParams.method && queryParams.method !== "GET") {
      throw new Error(`Write requests are explicitly blocked on read-only resource: ${normalizedResource}`);
    }

    return repo.paginate(
      { page: Number(queryParams.page) || 1, limit: Number(queryParams.limit) || 10 },
      []
    );
  }
}
