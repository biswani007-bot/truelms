/* eslint-disable @typescript-eslint/no-explicit-any */
import { assessmentRepository } from "../../repositories/assessment.repository";
import { TimelineService } from "./timeline.service";
import { Assessment } from "../../models/assessment.model";

export class AssessmentService {
  static async createAssessment(data: any, userId?: string) {
    const assessment = await assessmentRepository.create(data);
    await TimelineService.logEvent(assessment._id.toString(), "created", "Assessment draft created", userId);
    return assessment;
  }

  static async publishAssessment(id: string, userId?: string) {
    const updated = await Assessment.findByIdAndUpdate(id, { status: "published" }, { new: true });
    await TimelineService.logEvent(id, "published", "Assessment schedule published to cohort", userId);
    return updated;
  }

  static async startAssessment(id: string, userId?: string) {
    const updated = await Assessment.findByIdAndUpdate(id, { status: "running" }, { new: true });
    await TimelineService.logEvent(id, "started", "Assessment status updated to running", userId);
    return updated;
  }

  static async completeAssessment(id: string, userId?: string) {
    const updated = await Assessment.findByIdAndUpdate(id, { status: "completed" }, { new: true });
    await TimelineService.logEvent(id, "evaluated", "Assessment window closed", userId);
    return updated;
  }
}
