import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";

async function runIntegrityCheck() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");

  const Jobs = db.collection("jobs");
  const BusinessEvents = db.collection("businessevents");
  const Notifications = db.collection("notifications");
  const Users = db.collection("users");

  console.log("=== MILESTONE 5 INTEGRITY CHECK ===");

  const jobs = await Jobs.find({ isDeleted: { $ne: true } }).toArray();
  console.log(`Found ${jobs.length} jobs.`);

  let inconsistencies = 0;

  for (const job of jobs) {
    if (job.status === "running") {
      const now = new Date();
      if (job.leaseExpiresAt && new Date(job.leaseExpiresAt) < now) {
        console.error(`[ERROR] Job ${job.jobId} stuck in running state with expired lease.`);
        inconsistencies++;
      }
    }
    
    if (job.status === "completed" && job.nextAttemptAt > job.completedAt) {
      console.warn(`[WARN] Job ${job.jobId} is completed but has future nextAttemptAt.`);
    }

    if (job.status === "pending" || job.status === "retrying") {
      if (job.attempts >= job.maxAttempts) {
        console.error(`[ERROR] Job ${job.jobId} is pending/retrying but attempts (${job.attempts}) >= maxAttempts (${job.maxAttempts}).`);
        inconsistencies++;
      }
    }
  }

  const events = await BusinessEvents.find({ isDeleted: { $ne: true } }).toArray();
  for (const event of events) {
    if (!event.idempotencyKey) {
      console.error(`[ERROR] BusinessEvent ${event.eventId} missing idempotencyKey.`);
      inconsistencies++;
    }
  }

  const notifs = await Notifications.find({ isDeleted: { $ne: true } }).toArray();
  for (const notif of notifs) {
    if (!notif.recipient) {
      console.error(`[ERROR] Notification ${notif._id} missing recipient.`);
      inconsistencies++;
    } else {
      const user = await Users.findOne({ _id: notif.recipient });
      if (!user) {
        console.error(`[ERROR] Notification ${notif._id} references invalid recipient ${notif.recipient}.`);
        inconsistencies++;
      }
    }
  }

  if (inconsistencies === 0) {
    console.log("[PASS] All cross-domain integrity checks passed for Communication & Jobs!");
  } else {
    console.log(`[FAIL] Found ${inconsistencies} inconsistencies.`);
  }

  process.exit(inconsistencies === 0 ? 0 : 1);
}

runIntegrityCheck().catch(console.error);
