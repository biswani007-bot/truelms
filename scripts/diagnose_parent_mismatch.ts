import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

async function diagnose() {
  await mongoose.connect(process.env.MONGODB_URI!, { family: 4 });
  const db = mongoose.connection.useDb("lmsca");

  console.log("=== 1. USERS matching parent@truelern.com or Robin Hood or Bro Mercer ===");
  const users = await db.collection("users").find({
    $or: [
      { email: /parent@truelern\.com/i },
      { firstName: /Robin|Bro/i },
      { lastName: /Hood|Mercer/i },
      { name: /Robin|Bro|Mercer|Hood/i }
    ]
  }).toArray();
  console.log(JSON.stringify(users, null, 2));

  console.log("\n=== 2. PARENTS matching parent@truelern.com or Robin Hood or Bro Mercer ===");
  const parents = await db.collection("parents").find({
    $or: [
      { email: /parent@truelern\.com/i },
      { firstName: /Robin|Bro/i },
      { lastName: /Hood|Mercer/i }
    ]
  }).toArray();
  console.log(JSON.stringify(parents, null, 2));

  console.log("\n=== 3. STUDENTS matching Alex Mishra or linked to above parents ===");
  const parentIds = parents.map(p => p._id);
  const userIds = users.map(u => u._id);
  const students = await db.collection("students").find({
    $or: [
      { firstName: /Alex/i },
      { lastName: /Mishra/i },
      { parent: { $in: parentIds } },
      { "parentInfo.email": /parent@truelern\.com/i }
    ]
  }).toArray();
  console.log(JSON.stringify(students, null, 2));

  console.log("\n=== 4. PARENT STUDENT LINKS ===");
  const links = await db.collection("parentstudentlinks").find({
    $or: [
      { parent: { $in: parentIds } },
      { student: { $in: students.map(s => s._id) } }
    ]
  }).toArray();
  console.log(JSON.stringify(links, null, 2));

  console.log("\n=== 5. LEADS matching parent@truelern.com or Robin Hood or Bro Mercer or Alex Mishra ===");
  const leads = await db.collection("leads").find({
    $or: [
      { email: /parent@truelern\.com/i },
      { fullName: /Robin|Bro|Mercer|Hood/i },
      { parent: { $in: parentIds } },
      { student: { $in: students.map(s => s._id) } }
    ]
  }).toArray();
  console.log(JSON.stringify(leads, null, 2));

  console.log("\n=== 6. DEMO SESSIONS matching above ===");
  const demos = await db.collection("demosessions").find({
    $or: [
      { parent: { $in: parentIds } },
      { student: { $in: students.map(s => s._id) } },
      { lead: { $in: leads.map(l => l._id) } }
    ]
  }).toArray();
  console.log(JSON.stringify(demos, null, 2));

  await mongoose.disconnect();
}

diagnose().catch(console.error);
