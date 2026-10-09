import mongoose from "mongoose";
import { DemoSession } from "../../models/demo-session.model";
import { Lead } from "../../models/lead.model";
import { leadTimelineRepository } from "../../repositories/lead-timeline.repository";
import { JobEngineService } from "../jobs/job-engine.service";
import { DEMO_COMPLETION_THRESHOLD_SECONDS } from "./demo-participation.service";
import { ApiError } from "../../utils/api-error";
import { ERROR_CODES } from "../../constants/error-codes";

export class DemoCompletionService {
  /**
   * Completes a DemoSession authoritatively.
   * Validates that the session exists and transitions status to 'completed'.
   * Cancels pending reminders and schedules demo.completed email automation.
   * Synchronizes the linked Lead status to 'demo_completed' and logs timeline audit.
   */
  static async completeDemoSession(
    demoId: string,
    completedByUserId?: string,
    options?: {
      reason?: string;
      enforceTelemetryThreshold?: boolean;
    }
  ) {
    if (!mongoose.isValidObjectId(demoId)) {
      throw new ApiError(400, "Invalid DemoSession ID", ERROR_CODES.VALIDATION_ERROR);
    }

    const demo = await DemoSession.findById(demoId);
    if (!demo || demo.isDeleted) {
      throw new ApiError(404, "Demo session not found", ERROR_CODES.NOT_FOUND);
    }

    // If telemetry threshold is explicitly required, enforce actual duration
    if (options?.enforceTelemetryThreshold) {
      const actualDuration = demo.actualDurationSeconds || 0;
      if (actualDuration < DEMO_COMPLETION_THRESHOLD_SECONDS) {
        throw new ApiError(
          400,
          `Demo cannot be completed: Child participation duration (${actualDuration}s) is below required completion threshold (${DEMO_COMPLETION_THRESHOLD_SECONDS}s).`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    const previousStatus = demo.status;
    demo.status = "completed";

    // If actualDurationSeconds is unset or 0, populate with scheduled duration in seconds
    if (!demo.actualDurationSeconds || demo.actualDurationSeconds === 0) {
      demo.actualDurationSeconds = (demo.duration || 45) * 60;
    }

    await demo.save();

    // 1. Cancel pending reminder jobs
    try {
      await JobEngineService.cancelJobs({
        entityType: "DemoSession",
        entityId: demo._id.toString(),
        jobType: "demo.reminder",
        reason: options?.reason || "Demo session completed",
      });
    } catch {
      // Non-blocking
    }

    // 2. Synchronize Lead status and timeline audit
    if (demo.lead) {
      const lead = await Lead.findById(demo.lead);
      if (lead) {
        if (lead.status === "demo_scheduled" || lead.status === "new" || lead.status === "contacted") {
          lead.status = "demo_completed";
          await lead.save();
        }
        try {
          await leadTimelineRepository.create({
            lead: new mongoose.Types.ObjectId(demo.lead.toString()),
            event: "demo_completed",
            description: `Demo session #${demo.demoCode} marked as completed (previous status: ${previousStatus}).`,
            performedBy: completedByUserId && mongoose.isValidObjectId(completedByUserId) ? new mongoose.Types.ObjectId(completedByUserId) : undefined,
            timestamp: new Date(),
          });
        } catch {
          // Non-blocking timeline creation
        }
      }
    }

    // 3. Schedule demo completion email automation
    if (demo.parent || demo.student) {
      let parentEmail = "parent@truelern.com";
      let parentName = "Parent";
      let childName = "Student";

      if (demo.parent) {
        const p = await mongoose.model("Parent").findById(demo.parent);
        if (p) {
          parentEmail = p.email;
          parentName = `${p.firstName} ${p.lastName}`.trim();
        }
      }
      if (demo.student) {
        const s = await mongoose.model("Student").findById(demo.student);
        if (s) {
          childName = `${s.firstName} ${s.lastName}`.trim();
        }
      }

      try {
        await JobEngineService.scheduleJob({
          jobType: "demo.completed",
          entityType: "DemoSession",
          entityId: demo._id.toString(),
          payload: {
            demoId: demo._id.toString(),
            parentEmail,
            parentName,
            childName,
            demoCode: demo.demoCode,
          },
          idempotencyKey: `demo-completed-${demo._id}`,
          priority: "high",
        });
      } catch {
        // Non-blocking job scheduling
      }
    }

    return {
      success: true,
      demo,
      message: "Demo session completed successfully.",
    };
  }
}
