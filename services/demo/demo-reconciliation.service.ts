import { DemoSession } from "../../models/demo-session.model";
import { logger } from "../../utils/logger";
import { DEMO_COMPLETION_THRESHOLD_SECONDS } from "./demo-participation.service";

export class DemoReconciliationService {
  /**
   * Reconciles demos whose scheduledEnd has passed.
   * If actual duration >= 9 mins (540s), mark completed.
   * Else mark missed/incomplete.
   */
  static async reconcileCompletedDemos() {
    const now = new Date();
    
    // Find all demo sessions that are still scheduled or live
    // but their scheduled end time is in the past
    const eligibleDemos = await DemoSession.find({
      status: { $in: ["scheduled", "live"] },
      scheduledEnd: { $lt: now },
      isDeleted: { $ne: true }
    });

    let completedCount = 0;
    let missedCount = 0;

    for (const demo of eligibleDemos) {
      try {
        const actualDuration = demo.actualDurationSeconds || 0;
        
        let newStatus = demo.status;
        if (actualDuration >= DEMO_COMPLETION_THRESHOLD_SECONDS) {
          newStatus = "completed";
          completedCount++;
        } else {
          newStatus = "missed";
          missedCount++;
        }

        demo.status = newStatus;
        await demo.save();

      } catch (err: any) {
        logger.error(`[DemoReconciliation] Failed to reconcile demo ${demo._id}: ${err.message}`);
      }
    }

    return {
      processed: eligibleDemos.length,
      completedCount,
      missedCount
    };
  }
}
