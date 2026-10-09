import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "";

async function main() {
  const start = Date.now();
  console.log("[Diagnostic] Starting bounded parent identity verification & heal...");

  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    console.log(`[Diagnostic] Connected to MongoDB in ${Date.now() - start}ms`);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("No database object");
    }

    const parentsCol = db.collection("parents");
    const usersCol = db.collection("users");
    const leadsCol = db.collection("leads");
    const studentsCol = db.collection("students");
    const linksCol = db.collection("parentstudentlinks");

    // 1. Authoritative Parent Record
    const parent = await parentsCol.findOne(
      { email: "parent@truelern.com", isDeleted: { $ne: true } },
      { projection: { _id: 1, firstName: 1, lastName: 1, email: 1, user: 1 } }
    );
    console.log("[Diagnostic] Authoritative Parent:", JSON.stringify(parent));

    if (!parent) {
      throw new Error("Parent record for parent@truelern.com not found");
    }

    // 2. Authoritative User Record
    const user = await usersCol.findOne(
      { _id: parent.user },
      { projection: { _id: 1, firstName: 1, lastName: 1, email: 1, role: 1 } }
    );
    console.log("[Diagnostic] Authoritative User:", JSON.stringify(user));

    // 3. Parent-Student Link and Student Record
    const links = await linksCol.find(
      { parent: parent._id, isDeleted: { $ne: true } },
      { projection: { _id: 1, parent: 1, student: 1, relationshipType: 1 } }
    ).toArray();
    console.log("[Diagnostic] Parent-Student Links count:", links.length);

    for (const link of links) {
      const stu = await studentsCol.findOne(
        { _id: link.student },
        { projection: { _id: 1, firstName: 1, lastName: 1, studentId: 1 } }
      );
      console.log(`[Diagnostic] Linked Student for link ${link._id}:`, JSON.stringify(stu));
    }

    // 4. Target Lead Record
    const targetLeadId = new mongoose.Types.ObjectId("6abb59e1a5f7aba5d0890031");
    let lead = await leadsCol.findOne(
      { _id: targetLeadId },
      { projection: { _id: 1, leadId: 1, fullName: 1, email: 1, parent: 1, student: 1 } }
    );
    console.log("[Diagnostic] Lead BEFORE heal:", JSON.stringify(lead));

    const authoritativeFullName = `${parent.firstName} ${parent.lastName}`.trim();

    if (lead && lead.fullName !== authoritativeFullName) {
      console.log(`[Diagnostic] Healing lead ${targetLeadId} fullName from "${lead.fullName}" to "${authoritativeFullName}"...`);
      await leadsCol.updateOne(
        { _id: targetLeadId },
        { $set: { fullName: authoritativeFullName, parent: parent._id } }
      );
      lead = await leadsCol.findOne(
        { _id: targetLeadId },
        { projection: { _id: 1, leadId: 1, fullName: 1, email: 1, parent: 1, student: 1 } }
      );
      console.log("[Diagnostic] Lead AFTER heal:", JSON.stringify(lead));
    }

    // 5. Verify Student Isolation: Check student Alex Mishra has not been modified
    const studentDoc = await studentsCol.findOne(
      { _id: lead?.student },
      { projection: { _id: 1, firstName: 1, lastName: 1, studentId: 1 } }
    );
    console.log("[Diagnostic] Student Record Check:", JSON.stringify(studentDoc));

    if (studentDoc?.firstName !== "Alex" || studentDoc?.lastName !== "Mishra") {
      throw new Error(`Student name was corrupted! Expected Alex Mishra, got ${studentDoc?.firstName} ${studentDoc?.lastName}`);
    }

    if (lead?.fullName !== "Robin Hood") {
      throw new Error(`Lead fullName mismatch! Expected Robin Hood, got ${lead?.fullName}`);
    }

    console.log(`[Diagnostic] SUCCESS! Completed in ${Date.now() - start}ms`);
  } catch (err: any) {
    console.error("[Diagnostic Error]", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("[Diagnostic] Mongoose disconnected cleanly.");
  }
}

main();
