import mongoose from "mongoose";
import { DemoSession } from "../../models/demo-session.model";
import { ApiError } from "../../utils/api-error";
import { ERROR_CODES } from "../../constants/error-codes";

export interface DemoParticipationPayload {
  event: "joined" | "heartbeat" | "left";
  studentId?: string;
  durationSeconds?: number;
  eventId: string;
  timestamp: Date;
}

// 9 minutes = 540 seconds (Demo completion threshold)
export const DEMO_COMPLETION_THRESHOLD_SECONDS = 540;

export class DemoParticipationService {
  /**
   * Records participation for a DemoSession securely.
   * Only the actual child participant (matching DemoSession.student) contributes to duration.
   */
  static async recordParticipation(
    userId: string,
    roles: string[],
    demoId: string,
    payload: DemoParticipationPayload
  ) {
    if (!mongoose.isValidObjectId(demoId)) {
      throw new ApiError(400, "Invalid DemoSession ID", ERROR_CODES.VALIDATION_ERROR);
    }

    const demo = await DemoSession.findById(demoId);
    if (!demo || demo.isDeleted) {
      throw new ApiError(404, "Demo session not found", ERROR_CODES.NOT_FOUND);
    }

    const normalizedRoles = roles.map((r) => (r || "").toLowerCase());
    const isStudent = normalizedRoles.includes("student");

    // We only process participation for the child.
    // If the parent or instructor joins, we ignore them for duration tracking.
    if (!isStudent) {
      return {
        status: "ignored",
        message: `Ignored participation for role: ${normalizedRoles.join(",")}. Only student participation counts towards demo completion.`,
      };
    }

    // Verify identity: the user ID or studentId must map to DemoSession.student
    const demoStudentIdStr = demo.student?.toString();
    if (!demoStudentIdStr) {
      return {
        status: "ignored",
        message: "Demo session has no student assigned.",
      };
    }

    // The token generator uses student._id as both userId and studentId for the child.
    if (userId !== demoStudentIdStr && payload.studentId !== demoStudentIdStr) {
      return {
        status: "ignored",
        message: "Participant identity does not match the demo student.",
      };
    }

    // Idempotency Check
    if (demo.jitsiEventsProcessed && demo.jitsiEventsProcessed.some((e: string) => e.startsWith(`${payload.eventId}|`))) {
      return {
        status: "acknowledged",
        message: "Event already processed (idempotent return).",
      };
    }

    // We append the event into jitsiEventsProcessed as a structured string to compute intervals
    // Format: "eventId|event|timestamp"
    const eventRecord = `${payload.eventId}|${payload.event}|${payload.timestamp.getTime()}`;
    const allEvents = [...(demo.jitsiEventsProcessed || []), eventRecord];

    // Compute actualDurationSeconds from all joined/left events
    let computedDuration = 0;
    let currentJoinTime: number | null = null;
    let firstJoin: Date | null = null;
    let lastLeave: Date | null = null;

    // Parse and sort events by timestamp
    const parsedEvents = allEvents.map(e => {
      const parts = e.split("|");
      return {
        id: parts[0],
        type: parts[1],
        ts: parseInt(parts[2], 10)
      };
    }).sort((a, b) => a.ts - b.ts);

    for (const evt of parsedEvents) {
      if (evt.type === "joined") {
        if (currentJoinTime === null) {
          currentJoinTime = evt.ts;
        }
        if (!firstJoin) {
          firstJoin = new Date(evt.ts);
        }
      } else if (evt.type === "left") {
        if (currentJoinTime !== null) {
          computedDuration += Math.floor((evt.ts - currentJoinTime) / 1000);
          currentJoinTime = null;
        }
        lastLeave = new Date(evt.ts);
      }
    }

    // Check completion threshold
    const isCompleted = computedDuration >= DEMO_COMPLETION_THRESHOLD_SECONDS;
    
    // Determine new status
    let newStatus = demo.status;
    if (isCompleted && demo.status !== "completed") {
      newStatus = "completed";
    }

    // Apply updates
    const updateSet: Record<string, any> = {
      actualDurationSeconds: computedDuration,
      status: newStatus,
    };
    if (demo.firstJoinTime || firstJoin) {
      updateSet.firstJoinTime = demo.firstJoinTime || firstJoin;
    }
    if (lastLeave || demo.lastLeaveTime) {
      updateSet.lastLeaveTime = lastLeave || demo.lastLeaveTime;
    }

    const updatedDoc = await DemoSession.findByIdAndUpdate(
      demoId,
      {
        $push: { jitsiEventsProcessed: eventRecord },
        $set: updateSet,
      },
      { new: true, strict: false }
    );

    return {
      success: true,
      status: newStatus,
      actualDurationSeconds: computedDuration,
      message: isCompleted ? "Demo completion threshold reached." : "Participation recorded.",
      updatedDoc: updatedDoc ? {
        id: updatedDoc._id,
        actualDurationSeconds: updatedDoc.actualDurationSeconds,
        jitsiEventsProcessed: updatedDoc.jitsiEventsProcessed,
        firstJoinTime: updatedDoc.firstJoinTime,
        lastLeaveTime: updatedDoc.lastLeaveTime
      } : null,
    };
  }
}
