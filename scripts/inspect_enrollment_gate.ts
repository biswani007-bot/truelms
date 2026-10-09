import "dotenv/config";
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function inspect() {
  const start = Date.now();
  console.log("[Diagnostic] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("No db");

    console.log("\n--- 1. PARENT & USER ---");
    const parent = await db.collection("parents").findOne({ email: "parent@truelern.com" });
    console.log("Parent:", parent ? { _id: parent._id, name: `${parent.firstName} ${parent.lastName}`, email: parent.email } : null);

    console.log("\n--- 2. STUDENT(S) & LINKS ---");
    const links = await db.collection("parentstudentlinks").find({ parent: parent?._id }).toArray();
    console.log("Links count:", links.length);
    for (const l of links) {
      const s = await db.collection("students").findOne({ _id: l.student });
      console.log("Link:", { linkId: l._id, studentId: l.student, studentName: s ? `${s.firstName} ${s.lastName} (${s.studentId})` : "NOT FOUND", isDeleted: l.isDeleted });
    }

    console.log("\n--- 3. LEADS ---");
    const leads = await db.collection("leads").find({
      $or: [{ email: "parent@truelern.com" }, { parent: parent?._id }]
    }).toArray();
    for (const ld of leads) {
      console.log("Lead:", {
        _id: ld._id,
        leadId: ld.leadId,
        fullName: ld.fullName,
        status: ld.status,
        parent: ld.parent,
        student: ld.student,
        interestedCourse: ld.interestedCourse,
        course: ld.course
      });
    }

    console.log("\n--- 4. DEMO SESSIONS ---");
    const demos = await db.collection("demosessions").find({
      $or: [
        { parent: parent?._id },
        { student: { $in: links.map(l => l.student) } },
        { lead: { $in: leads.map(l => l._id) } }
      ]
    }).toArray();
    for (const d of demos) {
      console.log("DemoSession:", {
        _id: d._id,
        demoCode: d.demoCode,
        status: d.status,
        parent: d.parent,
        student: d.student,
        lead: d.lead,
        teacher: d.teacher,
        scheduledStart: d.scheduledStart,
        actualDurationSeconds: d.actualDurationSeconds,
        jitsiEventsProcessedCount: d.jitsiEventsProcessed?.length || 0,
        createdAt: d.createdAt
      });
    }

    console.log("\n--- 5. ENROLLMENTS ---");
    const enrollments = await db.collection("enrollments").find({
      student: { $in: links.map(l => l.student) }
    }).toArray();
    for (const e of enrollments) {
      console.log("Enrollment:", {
        _id: e._id,
        enrollmentNumber: e.enrollmentNumber,
        status: e.status,
        student: e.student,
        course: e.course,
        lead: e.lead,
        cohort: e.cohort,
        createdAt: e.createdAt
      });
    }

    console.log("\n--- 6. INVOICES ---");
    const invoices = await db.collection("invoices").find({
      $or: [
        { enrollment: { $in: enrollments.map(e => e._id) } },
        { student: { $in: links.map(l => l.student) } }
      ]
    }).toArray();
    for (const inv of invoices) {
      console.log("Invoice:", {
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        enrollment: inv.enrollment,
        student: inv.student,
        status: inv.status,
        totalAmount: inv.totalAmount,
        outstandingAmount: inv.outstandingAmount
      });
    }

  } finally {
    await mongoose.disconnect();
    console.log(`[Diagnostic] Done in ${Date.now() - start}ms`);
  }
}

inspect();
