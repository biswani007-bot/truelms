/* eslint-disable @typescript-eslint/no-explicit-any */
import { assignmentRepository } from "../../repositories/assignment.repository";
import { TimelineService } from "./timeline.service";
import { Assignment } from "../../models/assignment.model";

export class AssignmentService {
  static async createAssignment(data: any, userId?: string) {
    const assignment = await assignmentRepository.create(data);
    await TimelineService.logEvent(assignment._id.toString(), "created", "Assignment draft created", userId);
    return assignment;
  }

  static async publishAssignment(id: string, userId?: string) {
    const updated = await Assignment.findByIdAndUpdate(id, { status: "published" }, { new: true });
    await TimelineService.logEvent(id, "published", "Assignment published and visible to students", userId);
    return updated;
  }

  static async closeAssignment(id: string, userId?: string) {
    const updated = await Assignment.findByIdAndUpdate(id, { status: "closed" }, { new: true });
    await TimelineService.logEvent(id, "updated", "Assignment closed for submissions", userId);
    return updated;
  }

  static async archiveAssignment(id: string, userId?: string) {
    const updated = await Assignment.findByIdAndUpdate(id, { status: "archived" }, { new: true });
    await TimelineService.logEvent(id, "archived", "Assignment archived and hidden", userId);
    return updated;
  }
}
