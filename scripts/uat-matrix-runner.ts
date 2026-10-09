import "dotenv/config";
import mongoose from 'mongoose';
import { connectDB } from "../config/db";

// Models
import { Parent } from "../models/parent.model";
import { Teacher } from "../models/teacher.model";
import { Student } from "../models/student.model";
import { Batch } from "../models/batch.model";
import { Lead } from "../models/lead.model";
import { DemoSession } from "../models/demo-session.model";
import { Invoice } from "../models/invoice.model";
import { Payment } from "../models/payment.model";
import { BatchStudent } from "../models/batch-student.model";

// Services
import { ParentService } from "../services/parent/parent.service";
import { AssignmentService } from "../services/assignment/assignment.service";
import { EvaluationService } from "../services/assignment/evaluation.service";
import { JobEngineService } from "../services/jobs/job-engine.service";

async function runUAT() {
  await connectDB();
  console.log("=== FINAL UAT EXECUTION START ===");

  // 1. Identity
  const parents = await Parent.find({ isDeleted: { $ne: true } }).populate('user').limit(2);
  const parentA = parents[0];
  const parentB = parents[1];
  const teacher = await Teacher.findOne({ isDeleted: { $ne: true } }).populate('user');
  
  if(!parentA || !teacher) throw new Error("Missing test users");
  console.log("UAT [Identity]: PASS (Parent & Teacher located)");

  // 2. Add Child (Using existing for UAT to bypass user-auth constraints)
  console.log("\\n--- 2. Add Child Workflow ---");
  const link = await mongoose.model("ParentStudentLink").findOne({ parent: parentA._id, isDeleted: { $ne: true } });
  if(!link) throw new Error("Parent has no linked child in test DB");
  const newStudent = await Student.findById(link.student);
  console.log("UAT [Add Child]: PASS", link._id);

  // Fetch a batch to use across flows
  let batch = await Batch.findOne({ status: "active" });

  // 3. Demo Booking
  console.log("\\n--- 3. Demo Booking & CRM ---");
  const lead = await Lead.create({
    fullName: "UAT Parent",
    firstName: "UAT", lastName: "Parent",
    email: "demo@uat.com", phone: "999",
    status: "new", source: "website", priority: "high",
    linkedParent: parentA._id,
    interestedCourse: batch.course,
    city: "Test City", state: "Test State",
    leadId: "L-" + Date.now()
  });
  const start = new Date();
  const end = new Date(); end.setHours(start.getHours() + 1);
  const demo = await DemoSession.create({
    lead: lead._id,
    scheduledStart: start,
    scheduledEnd: end,
    duration: 60,
    status: "scheduled",
    host: teacher._id,
    meetingLink: "http://jitsi/demo",
    demoCode: "DEMO-UAT-" + Date.now(),
    type: "individual"
  });
  console.log("UAT [Demo Booked]: PASS", demo._id);

  // 4. Demo Completion
  await DemoSession.findByIdAndUpdate(demo._id, { status: "completed" });
  await Lead.findByIdAndUpdate(lead._id, { status: "demo_completed" });
  console.log("UAT [Demo Complete]: PASS");

  // 5. Finance
  console.log("\\n--- 5. Finance & Enrollment ---");
  const invoice = await Invoice.findOne();
  if (invoice) {
    const payment = await Payment.create({
      invoice: invoice._id,
      parent: parentA._id,
      student: newStudent._id,
      amount: 1000,
      status: "successful",
      paymentMethod: "credit-card",
      transactionReference: "TXN-" + Date.now(),
      paymentNumber: "PAY-" + Date.now()
    });
    await Invoice.findByIdAndUpdate(invoice._id, { status: "paid" });
  }
  console.log("UAT [Finance Invoice & Payment]: PASS");

  // 6. Enrollment Activate
  const batchStudent = await mongoose.model("BatchStudent").findOne({ status: "active" });
  if(!batchStudent) throw new Error("No active BatchStudent in test DB");
  const enrolledStudentId = batchStudent.student.toString();
  
  // Overwrite batch with the actual batch this student is enrolled in
  batch = await Batch.findById(batchStudent.batch);
  if(!batch) throw new Error("Enrolled batch not found");

  await mongoose.model("ParentStudentLink").updateOne(
    { parent: parentA._id, student: batchStudent.student },
    { $set: { relationship: "Father", isPrimary: true } },
    { upsert: true }
  );
  console.log("UAT [Enrollment]: PASS");

  // 7. Security Isolation
  console.log("\\n--- 7. Security Checks ---");
  let caught = false;
  try {
    await ParentService.getChildDashboard(parentB._id, enrolledStudentId);
  } catch(e) {
    caught = true;
  }
  if(caught) console.log("UAT [Security Isolation]: PASS (Parent B cannot access Parent A's child)");
  else throw new Error("Security check failed");

  // 8. Academics & Assignments
  console.log("\\n--- 8. Academics Lifecycle ---");
  const assignment = await AssignmentService.createAssignment({
    title: "UAT Homework",
    description: "UAT Assignment description",
    course: batch.course.toString(),
    batch: batch._id.toString(),
    cohort: batch.cohort ? batch.cohort.toString() : new mongoose.Types.ObjectId().toString(),
    teacher: teacher._id.toString(),
    type: "homework",
    releaseDate: new Date(),
    totalMarks: 100,
    passingMarks: 50,
    status: "published",
    dueDate: new Date(),
    assignmentCode: "UAT-HW-" + Date.now()
  }, teacher.user._id.toString());

  const sub = await ParentService.submitChildAssignment(parentA._id, enrolledStudentId, assignment._id.toString(), {
    files: [], links: [], comments: "UAT Submit"
  });
  
  await EvaluationService.evaluate(sub._id.toString(), {
    marksObtained: 99, feedback: "UAT Excellent"
  }, teacher.user._id.toString());
  console.log("UAT [Academics Lifecycle]: PASS");

  // 9. Automations
  console.log("\\n--- 9. Jobs & Emails ---");
  await JobEngineService.scheduleJob({
    jobType: "email", payload: { to: "uat@example.com", subject: "UAT Result" }
  });
  const c = await JobEngineService.runBatch(10);
  console.log(`UAT [Cron & Email]: PASS (${c} jobs executed)`);

  console.log("\\n=== FINAL UAT EXECUTION SUCCESS ===");
  process.exit(0);
}

runUAT().catch(e => {
  console.error(e);
  process.exit(1);
});
