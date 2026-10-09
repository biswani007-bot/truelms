import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Lead } from "../models/lead.model";
import { User } from "../models/user.model";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { ParentStudentLink } from "../models/parent-student-link.model";
import { Course } from "../models/course.model";
import { DemoSession } from "../models/demo-session.model";
import { Enrollment } from "../models/enrollment.model";
import { Invoice } from "../models/invoice.model";
import { Payment } from "../models/payment.model";
import { JwtHelper } from "../helpers/jwt";
import { POST as enrollLead } from "../app/api/crm/leads/[id]/enroll/route";
import { ParentService } from "../services/parent/parent.service";
import { PaymentAutomationService } from "../services/automation/payment-automation.service";
import { NextRequest } from "next/server";

async function runTests() {
  console.log("=== TrueLern Admin CRM Enrollment Conversion Test Suite ===\n");
  const startTime = Date.now();
  await connectDB();
  console.log(`[PASS] Connected to MongoDB in ${Date.now() - startTime}ms`);

  const testSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  const cleanupIds: {
    users: mongoose.Types.ObjectId[];
    parents: mongoose.Types.ObjectId[];
    students: mongoose.Types.ObjectId[];
    links: mongoose.Types.ObjectId[];
    courses: mongoose.Types.ObjectId[];
    leads: mongoose.Types.ObjectId[];
    demoSessions: mongoose.Types.ObjectId[];
    enrollments: mongoose.Types.ObjectId[];
    invoices: mongoose.Types.ObjectId[];
    payments: mongoose.Types.ObjectId[];
  } = {
    users: [],
    parents: [],
    students: [],
    links: [],
    courses: [],
    leads: [],
    demoSessions: [],
    enrollments: [],
    invoices: [],
    payments: [],
  };

  try {
    const adminToken = JwtHelper.signAccess({
      userId: new mongoose.Types.ObjectId().toString(),
      role: "admin",
    });

    // 1. Setup Parent & Students
    const parentUser = await User.create({
      firstName: "TestAdminParent",
      lastName: `Fixture${testSuffix}`,
      email: `parent_adm_${testSuffix}@truelern.test`,
      password: "TestPassword123!",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"),
      isEmailVerified: true,
    });
    cleanupIds.users.push(parentUser._id);

    const parent = await Parent.create({
      user: parentUser._id,
      parentId: `PAR-ADM-${testSuffix}`,
      firstName: parentUser.firstName,
      lastName: parentUser.lastName,
      email: parentUser.email,
      phone: "+15551234567",
      address: "123 Elm St",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      postalCode: "94107",
      status: "active",
    });
    cleanupIds.parents.push(parent._id);

    const studentUser1 = await User.create({
      firstName: "Alex",
      lastName: `AdminChild${testSuffix}`,
      email: `alex_adm_${testSuffix}@truelern.test`,
      password: "TestPassword123!",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"),
    });
    cleanupIds.users.push(studentUser1._id);

    const student1 = await Student.create({
      user: studentUser1._id,
      studentId: `STU-ADM1-${testSuffix}`,
      admissionNumber: `ADM-A1-${testSuffix}`,
      registrationNumber: `REG-A1-${testSuffix}`,
      firstName: "Alex",
      lastName: `AdminChild${testSuffix}`,
      phone: "+15551234568",
      parent: parent._id,
      status: "active",
    });
    cleanupIds.students.push(student1._id);

    const link1 = await ParentStudentLink.create({
      parent: parent._id,
      student: student1._id,
      relationshipType: "father",
      canAccessPortal: true,
    });
    cleanupIds.links.push(link1._id);

    // Sibling Student 2
    const studentUser2 = await User.create({
      firstName: "Bobby",
      lastName: `AdminChild${testSuffix}`,
      email: `bobby_adm_${testSuffix}@truelern.test`,
      password: "TestPassword123!",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"),
    });
    cleanupIds.users.push(studentUser2._id);

    const student2 = await Student.create({
      user: studentUser2._id,
      studentId: `STU-ADM2-${testSuffix}`,
      admissionNumber: `ADM-A2-${testSuffix}`,
      registrationNumber: `REG-A2-${testSuffix}`,
      firstName: "Bobby",
      lastName: `AdminChild${testSuffix}`,
      phone: "+15551234569",
      parent: parent._id,
      status: "active",
    });
    cleanupIds.students.push(student2._id);

    const link2 = await ParentStudentLink.create({
      parent: parent._id,
      student: student2._id,
      relationshipType: "father",
      canAccessPortal: true,
    });
    cleanupIds.links.push(link2._id);

    // 2. Setup Course A and Course B
    const courseA = await Course.create({
      courseName: `Future-Ready Robotics A ${testSuffix}`,
      courseCode: `FRB-A-${testSuffix}`,
      slug: `future-ready-robotics-a-${testSuffix}`,
      category: new mongoose.Types.ObjectId(),
      shortDescription: "Course A short description",
      longDescription: "Course A long description",
      duration: 16,
      level: "beginner",
      status: "published",
      pricing: { price: 500, discountPrice: 450, currency: "USD", taxPercentage: 10 },
    });
    cleanupIds.courses.push(courseA._id);

    const courseB = await Course.create({
      courseName: `Creative Design B ${testSuffix}`,
      courseCode: `CDB-${testSuffix}`,
      slug: `creative-design-b-${testSuffix}`,
      category: new mongoose.Types.ObjectId(),
      shortDescription: "Course B short description",
      longDescription: "Course B long description",
      duration: 12,
      level: "beginner",
      status: "published",
      pricing: { price: 300, discountPrice: 250, currency: "USD", taxPercentage: 10 },
    });
    cleanupIds.courses.push(courseB._id);

    // 3. Setup Lead
    const testLead = await Lead.create({
      leadId: `LED-ADM-${testSuffix}`,
      fullName: `${parent.firstName} ${parent.lastName}`,
      email: parent.email,
      phone: parent.phone,
      parent: parent._id,
      student: student1._id,
      course: courseA._id,
      interestedCourse: courseA.courseName,
      city: "San Francisco",
      state: "CA",
      country: "USA",
      status: "demo_scheduled",
    });
    cleanupIds.leads.push(testLead._id);

    // ── TEST 2: INCOMPLETE DEMO CANNOT BYPASS THE COMPLETION GATE ─────────────
    console.log("[Test 2] Verifying incomplete demo blocks admin enrollment conversion...");
    const incompleteDemo = await DemoSession.create({
      demoCode: `DEMO-INC-${testSuffix}`,
      lead: testLead._id,
      parent: parent._id,
      student: student1._id,
      course: courseA._id,
      interestedCourse: courseA.courseName,
      scheduledStart: new Date(Date.now() + 3600000),
      scheduledEnd: new Date(Date.now() + 5400000),
      duration: 30,
      meetingPlatform: "jitsi",
      meetingLink: "/parent/demo/join",
      status: "scheduled",
    });
    cleanupIds.demoSessions.push(incompleteDemo._id);

    const test2Req = new NextRequest(`http://localhost:3000/api/crm/leads/${testLead._id}/enroll`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    const test2Res = await enrollLead(test2Req, { params: Promise.resolve({ id: testLead._id.toString() }) });
    const test2Json = await test2Res.json();
    if (test2Res.status !== 400 || test2Json.success !== false) {
      throw new Error(`FAIL: Incomplete demo did not block enrollment: ${JSON.stringify(test2Json)}`);
    }
    console.log(`[PASS] Correctly rejected incomplete demo: ${test2Json.message}`);

    // ── TEST 1: LEGITIMATELY COMPLETED DEMO PERMITS ENROLLMENT CONVERSION ─────
    console.log("\n[Test 1] Verifying legitimately completed demo allows enrollment conversion...");
    incompleteDemo.status = "completed";
    await incompleteDemo.save();

    const test1Req = new NextRequest(`http://localhost:3000/api/crm/leads/${testLead._id}/enroll`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ notes: "Counsellor initiated enrollment" }),
    });
    const test1Res = await enrollLead(test1Req, { params: Promise.resolve({ id: testLead._id.toString() }) });
    const test1Json = await test1Res.json();
    if (test1Res.status !== 201 || !test1Json.success) {
      throw new Error(`FAIL: Completed demo failed to convert: ${JSON.stringify(test1Json)}`);
    }
    console.log(`[PASS] Enrollment conversion succeeded: #${test1Json.data.enrollmentNumber}, Invoice #${test1Json.data.invoiceNumber}`);
    cleanupIds.enrollments.push(new mongoose.Types.ObjectId(test1Json.data.enrollmentId));
    cleanupIds.invoices.push(new mongoose.Types.ObjectId(test1Json.data.invoiceId));

    // ── TEST 3 & 4: REUSING EXISTING ENROLLMENT / INVOICE WITHOUT DUPLICATES ──
    console.log("\n[Test 3 & 4] Verifying reuse of existing waiting-payment enrollment and invoice...");
    const enrollCountBefore = await Enrollment.countDocuments();
    const invoiceCountBefore = await Invoice.countDocuments();

    const test3Req = new NextRequest(`http://localhost:3000/api/crm/leads/${testLead._id}/enroll`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    const test3Res = await enrollLead(test3Req, { params: Promise.resolve({ id: testLead._id.toString() }) });
    const test3Json = await test3Res.json();
    if (test3Res.status !== 200 || !test3Json.success) {
      throw new Error(`FAIL: Existing enrollment was not reused: ${JSON.stringify(test3Json)}`);
    }
    if (test3Json.data.enrollmentNumber !== test1Json.data.enrollmentNumber ||
        test3Json.data.invoiceNumber !== test1Json.data.invoiceNumber) {
      throw new Error("FAIL: Reused enrollment/invoice IDs did not match original!");
    }
    const enrollCountAfter = await Enrollment.countDocuments();
    const invoiceCountAfter = await Invoice.countDocuments();
    if (enrollCountBefore !== enrollCountAfter || invoiceCountBefore !== invoiceCountAfter) {
      throw new Error("FAIL: Duplicate enrollment or invoice was created during repeated call!");
    }
    console.log(`[PASS] Perfectly reused #${test3Json.data.enrollmentNumber} & #${test3Json.data.invoiceNumber} without duplicates.`);

    // ── TEST 5: MISMATCHED STUDENT / COURSE RELATIONSHIP IS REJECTED SAFELY ──
    console.log("\n[Test 5] Verifying mismatched student/course relationship is rejected...");
    // Create a new lead referencing Student 2, but point its enrollment to Student 1's enrollment
    const mismatchedLead = await Lead.create({
      leadId: `LED-MIS-${testSuffix}`,
      fullName: "Sibling Lead",
      email: parent.email,
      phone: parent.phone,
      parent: parent._id,
      student: student2._id,
      course: courseA._id,
      interestedCourse: courseA.courseName,
      city: "San Francisco",
      state: "CA",
      country: "USA",
      status: "demo_scheduled",
      enrollment: new mongoose.Types.ObjectId(test1Json.data.enrollmentId), // Intentional mismatch!
    });
    cleanupIds.leads.push(mismatchedLead._id);

    const test5Req = new NextRequest(`http://localhost:3000/api/crm/leads/${mismatchedLead._id}/enroll`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    const test5Res = await enrollLead(test5Req, { params: Promise.resolve({ id: mismatchedLead._id.toString() }) });
    const test5Json = await test5Res.json();
    if (test5Res.status !== 409 && test5Res.status !== 400) {
      throw new Error(`FAIL: Mismatched relationship was not safely rejected: ${JSON.stringify(test5Json)}`);
    }
    console.log(`[PASS] Correctly rejected mismatched student relationship: ${test5Json.message}`);

    // ── TEST 6: ENROLLMENT REMAINS WAITING-PAYMENT UNTIL PAYMENT ──────────────
    console.log("\n[Test 6] Verifying enrollment remains waiting-payment before payment...");
    const currentEnrollment = await Enrollment.findById(test1Json.data.enrollmentId);
    if (currentEnrollment?.status !== "waiting-payment") {
      throw new Error(`FAIL: Expected status 'waiting-payment', got '${currentEnrollment?.status}'`);
    }
    console.log("[PASS] Enrollment remains waiting-payment before payment.");

    // ── TEST 7: PAYMENT CONFIRMATION TRIGGERS ENROLLMENT CONFIRMATION & AUTOMATION
    console.log("\n[Test 7] Verifying payment completion confirms enrollment...");
    const simPayment = await Payment.create({
      paymentNumber: `PMT-TEST-${testSuffix}`,
      invoice: new mongoose.Types.ObjectId(test1Json.data.invoiceId),
      student: student1._id,
      amount: test1Json.data.totalAmount,
      currency: "USD",
      status: "success",
      paymentMethod: "online-gateway",
      gateway: "stripe",
      transactionReference: `txn_adm_${testSuffix}`,
      paymentDate: new Date(),
    });
    cleanupIds.payments.push(simPayment._id);

    await PaymentAutomationService.handlePaymentCompleted(simPayment._id.toString());

    const confirmedEnrollment = await Enrollment.findById(test1Json.data.enrollmentId);
    if (confirmedEnrollment?.status !== "confirmed") {
      throw new Error(`FAIL: Expected enrollment status 'confirmed', got '${confirmedEnrollment?.status}'`);
    }
    console.log(`[PASS] Payment transitioned enrollment #${confirmedEnrollment.enrollmentNumber} to 'confirmed'.`);

    // ── TEST 8: CRM LEAD STATUS AND ENROLLMENT STATUS REMAIN CONSISTENT ───────
    console.log("\n[Test 8] Verifying CRM Lead status consistency...");
    const updatedLead = await Lead.findById(testLead._id);
    if (updatedLead?.status !== "enrolled") {
      throw new Error(`FAIL: Expected lead status 'enrolled', got '${updatedLead?.status}'`);
    }
    console.log(`[PASS] Lead status is consistently updated to 'enrolled'.`);

    // ── TEST 9: FAILURES RETURN USEFUL DIAGNOSTICS WITHOUT SENSITIVE LEAKS ────
    console.log("\n[Test 9] Verifying safe error response without sensitive leaks...");
    const invalidReq = new NextRequest(`http://localhost:3000/api/crm/leads/nonexistent123456789012/enroll`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    const invalidRes = await enrollLead(invalidReq, { params: Promise.resolve({ id: "nonexistent123456789012" }) });
    const invalidJson = await invalidRes.json();
    if (invalidRes.status !== 404 || invalidJson.success !== false) {
      throw new Error(`FAIL: Expected 404, got ${invalidRes.status}`);
    }
    if (invalidJson.stack || invalidJson.token || invalidJson.secret) {
      throw new Error("FAIL: Sensitive diagnostic information leaked in response!");
    }
    console.log("[PASS] Diagnostic response returned cleanly without leaking sensitive fields.");

    // ── TEST 10: EXISTING PARENT-CHILD ISOLATION & ACCESS GUARDS PASS ─────────
    console.log("\n[Test 10] Verifying parent-child isolation guard...");
    const strangerParentId = new mongoose.Types.ObjectId();
    let test10Passed = false;
    try {
      await ParentService.authorizeChildAccess(strangerParentId, student1._id.toString());
    } catch (err: any) {
      if (err.statusCode === 403 || err.message.includes("Unauthorized")) {
        test10Passed = true;
      }
    }
    if (!test10Passed) {
      throw new Error("FAIL: Unauthorized parent was able to access student!");
    }
    console.log("[PASS] Parent-child isolation verified.");

    console.log("\n=======================================================");
    console.log("ALL 10 CRM ENROLLMENT CONVERSION TESTS PASSED!");
    console.log("=======================================================\n");

  } finally {
    console.log("[Teardown] Cleaning up disposable fixtures...");
    for (const id of cleanupIds.payments) await Payment.deleteOne({ _id: id });
    for (const id of cleanupIds.invoices) await Invoice.deleteOne({ _id: id });
    for (const id of cleanupIds.enrollments) await Enrollment.deleteOne({ _id: id });
    for (const id of cleanupIds.demoSessions) await DemoSession.deleteOne({ _id: id });
    for (const id of cleanupIds.leads) await Lead.deleteOne({ _id: id });
    for (const id of cleanupIds.links) await ParentStudentLink.deleteOne({ _id: id });
    for (const id of cleanupIds.students) await Student.deleteOne({ _id: id });
    for (const id of cleanupIds.parents) await Parent.deleteOne({ _id: id });
    for (const id of cleanupIds.users) await User.deleteOne({ _id: id });
    for (const id of cleanupIds.courses) await Course.deleteOne({ _id: id });
    console.log("[Teardown] Cleanup complete.");
    await mongoose.disconnect();
    console.log("[Teardown] Disconnected from MongoDB.");
  }
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
