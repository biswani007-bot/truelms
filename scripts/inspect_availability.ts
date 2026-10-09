import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

async function check() {
  await mongoose.connect(process.env.MONGODB_URI!, { family: 4 });
  const rawColl = mongoose.connection.collection("demoavailabilities");

  const targetDate = new Date(1791534600000);
  console.log("Target date:", targetDate.toISOString(), 1791534600000);

  const records = await rawColl.find({ scheduledStart: targetDate }).toArray();
  console.log("Found records at target date:", records.length);
  for (const r of records) {
    console.log(JSON.stringify(r, null, 2));
  }

  const indexes = await rawColl.indexes();
  console.log("\nIndexes on demoavailabilities:", JSON.stringify(indexes, null, 2));

  const total = await rawColl.countDocuments();
  const deletedCount = await rawColl.countDocuments({ isDeleted: true });
  const activeCount = await rawColl.countDocuments({ isDeleted: false });
  console.log(`\nTotal: ${total}, Active: ${activeCount}, Deleted: ${deletedCount}`);

  // Check for duplicate keys in active or deleted
  const dupCheck = await rawColl.aggregate([
    {
      $group: {
        _id: {
          scheduledStart: "$scheduledStart",
          teacher: "$teacher",
          course: "$course",
          isDeleted: "$isDeleted"
        },
        count: { $sum: 1 },
        ids: { $push: "$_id" }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  console.log("\nDuplicate groups found:", dupCheck.length);
  for (const d of dupCheck) {
    console.log(d);
  }

  // Also check all records created recently or for today
  const recent = await rawColl.find({}).sort({ scheduledStart: -1 }).limit(10).toArray();
  console.log("\nMost recent scheduledStart slots (top 10):");
  for (const r of recent) {
    console.log({
      _id: r._id,
      scheduledStart: r.scheduledStart,
      startTime: r.startTime,
      status: r.status,
      isDeleted: r.isDeleted,
      bookedCount: r.bookedCount,
      teacher: r.teacher,
      course: r.course
    });
  }

  await mongoose.disconnect();
}

check().catch(console.error);
