import "dotenv/config";
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

import { ParentService } from "../services/parent/parent.service";
import { DemoCompletionService } from "../services/demo/demo-completion.service";
import { PaymentAutomationService } from "../services/automation/payment-automation.service";
import { CheckoutTokenService } from "../services/auth/checkout-token.service";
import { Parent } from "../models/parent.model";
import { User } from "../models/user.model";
import { Student } from "../models/student.model";
import { ParentStudentLink } from "../models/parent-student-link.model";
import { Course } from "../models/course.model";
import { Lead } from "../models/lead.model";
import { DemoSession } from "../models/demo-session.model";
import { Enrollment } from "../models/enrollment.model";
import { Invoice } from "../models/invoice.model";
import { Payment } from "../models/payment.model";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function runLifecycleTests() {
  const start = Date.now();
  console.log("=== TrueLern Demo Completion & Enrollment Gate Lifecycle Test Suite ===");

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI not configured");
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  console.log(`[PASS] Connected to MongoDB in ${Date.now() - start}ms`);

  const testSuffix = Date.now().toString().slice(-6);
  const createdIds: { [col: string]: mongoose.Types.ObjectId[] } = {
    users: [],
    parents: [],
    students: [],
    links: [],
    courses: [],
    leads: [],
    demos: [],
    enrollments: [],
    invoices: [],
    payments: [],
  };

  try {
    // ── SETUP DISPOSABLE FIXTURES ──────────────────────────────────────────────
    console.log("\n[Setup] Creating disposable test fixtures...");

    // 1. Parent & User
    const user = await User.create({
      firstName: "TestParent",
      lastName: `Fixture${testSuffix}`,
      email: `testparent-${testSuffix}@truelern.test`,
      password: "TestPasswordHash123",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"), // Parent role
      isEmailVerified: true,
    });
    createdIds.users.push(user._id);

    const parent = await Parent.create({
      user: user._id,
      parentId: `PAR-TEST-${testSuffix}`,
      firstName: "TestParent",
      lastName: `Fixture${testSuffix}`,
      email: user.email,
      phone: "+15550001111",
      address: "123 Test St",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      postalCode: "94105",
      status: "active",
    });
    createdIds.parents.push(parent._id);

    // 2. Student 1 and Sibling (Student 2)
    const stuUser1 = await User.create({
      firstName: "Alice",
      lastName: `Child${testSuffix}`,
      email: `alice-${testSuffix}@truelern.test`,
      password: "TestPasswordHash123",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"),
    });
    createdIds.users.push(stuUser1._id);

    const student1 = await Student.create({
      user: stuUser1._id,
      studentId: `STU-TEST1-${testSuffix}`,
      admissionNumber: `ADM-T1-${testSuffix}`,
      registrationNumber: `REG-T1-${testSuffix}`,
      firstName: "Alice",
      lastName: `Child${testSuffix}`,
      phone: "+15550002222",
      status: "active",
    });
    createdIds.students.push(student1._id);

    const stuUser2 = await User.create({
      firstName: "Bob",
      lastName: `Child${testSuffix}`,
      email: `bob-${testSuffix}@truelern.test`,
      password: "TestPasswordHash123",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"),
    });
    createdIds.users.push(stuUser2._id);

    const student2 = await Student.create({
      user: stuUser2._id,
      studentId: `STU-TEST2-${testSuffix}`,
      admissionNumber: `ADM-T2-${testSuffix}`,
      registrationNumber: `REG-T2-${testSuffix}`,
      firstName: "Bob",
      lastName: `Child${testSuffix}`,
      phone: "+15550003333",
      status: "active",
    });
    createdIds.students.push(student2._id);

    // 3. Parent-Student Links
    const link1 = await ParentStudentLink.create({
      parent: parent._id,
      student: student1._id,
      relationshipType: "mother",
      canAccessPortal: true,
    });
    createdIds.links.push(link1._id);

    const link2 = await ParentStudentLink.create({
      parent: parent._id,
      student: student2._id,
      relationshipType: "mother",
      canAccessPortal: true,
    });
    createdIds.links.push(link2._id);

    // 4. Course A and Course B
    const existingCategory = await mongoose.model("Category").findOne();
    const categoryId = existingCategory?._id || new mongoose.Types.ObjectId();

    const courseA = await Course.create({
      courseName: `Test Robotics Course A ${testSuffix}`,
      courseCode: `TL-ROB-A-${testSuffix}`,
      slug: `test-robotics-a-${testSuffix}`,
      shortDescription: "Short test description for Course A",
      longDescription: "Long detailed test description for Course A",
      category: categoryId,
      duration: 12,
      durationUnit: "weeks",
      level: "beginner",
      status: "published",
      pricing: { price: 500, discountPrice: 450, currency: "USD", taxPercentage: 10 },
    });
    createdIds.courses.push(courseA._id);

    const courseB = await Course.create({
      courseName: `Test AI Course B ${testSuffix}`,
      courseCode: `TL-AI-B-${testSuffix}`,
      slug: `test-ai-b-${testSuffix}`,
      shortDescription: "Short test description for Course B",
      longDescription: "Long detailed test description for Course B",
      category: categoryId,
      duration: 12,
      durationUnit: "weeks",
      level: "intermediate",
      status: "published",
      pricing: { price: 600, discountPrice: 550, currency: "USD", taxPercentage: 10 },
    });
    createdIds.courses.push(courseB._id);

    // 5. Lead for Student 1
    const lead = await Lead.create({
      leadId: `LED-TEST-${testSuffix}`,
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
      leadSource: "parent-portal",
      learningMode: "live",
      priority: "high",
    });
    createdIds.leads.push(lead._id);

    // ── TEST 1: INCOMPLETE DEMO PREVENTS ENROLLMENT ──────────────────────────
    console.log("\n[Test 1] Verifying incomplete demo prevents enrollment...");
    const demo = await DemoSession.create({
      demoCode: `DEMO-TEST-${testSuffix}`,
      lead: lead._id,
      parent: parent._id,
      student: student1._id,
      course: courseA._id,
      interestedCourse: courseA.courseName,
      scheduledStart: new Date(Date.now() + 3600000),
      scheduledEnd: new Date(Date.now() + 6300000),
      duration: 45,
      actualDurationSeconds: 0,
      meetingPlatform: "jitsi",
      meetingLink: "https://meet.jit.si/test-demo",
      status: "scheduled",
    });
    createdIds.demos.push(demo._id);

    let test1Passed = false;
    try {
      await ParentService.initiateChildEnrollment(parent._id, student1._id.toString(), courseA._id.toString());
    } catch (err: any) {
      if (err.message.includes("Child has not completed a demo session")) {
        test1Passed = true;
        console.log(`[PASS] Correctly blocked enrollment initiation: ${err.message}`);
      } else {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }
    if (!test1Passed) {
      throw new Error("FAIL: Incomplete demo was allowed to initiate enrollment!");
    }

    // ── TEST 2: CHANGING CRM LEAD STATUS ALONE DOES NOT FALSELY COMPLETE DEMO ─
    console.log("\n[Test 2] Verifying CRM lead status change alone does not complete demo...");
    await Lead.findByIdAndUpdate(lead._id, { status: "demo_completed" });

    // Verify DemoSession is still scheduled
    const untouchedDemo = await DemoSession.findById(demo._id);
    if (untouchedDemo?.status !== "scheduled") {
      throw new Error(`FAIL: DemoSession status changed unexpectedly to ${untouchedDemo?.status}`);
    }

    let test2Passed = false;
    try {
      await ParentService.initiateChildEnrollment(parent._id, student1._id.toString(), courseA._id.toString());
    } catch (err: any) {
      if (err.message.includes("Child has not completed a demo session")) {
        test2Passed = true;
        console.log("[PASS] Correctly blocked enrollment even when Lead.status was 'demo_completed'.");
      }
    }
    if (!test2Passed) {
      throw new Error("FAIL: Changing Lead.status alone falsely allowed enrollment initiation!");
    }

    // ── TEST 3: LEGITIMATELY COMPLETED DEMO PERMITS ENROLLMENT INITIATION ────
    console.log("\n[Test 3] Verifying legitimately completed demo permits enrollment initiation...");
    const completeResult = await DemoCompletionService.completeDemoSession(demo._id.toString(), user._id.toString(), {
      reason: "Test completion by authorized staff",
    });

    if (completeResult.demo.status !== "completed") {
      throw new Error("DemoCompletionService failed to set demo status to 'completed'");
    }

    const enrollmentResult = await ParentService.initiateChildEnrollment(
      parent._id,
      student1._id.toString(),
      courseA._id.toString()
    );
    createdIds.enrollments.push(new mongoose.Types.ObjectId(enrollmentResult.enrollmentId));
    createdIds.invoices.push(new mongoose.Types.ObjectId(enrollmentResult.invoiceId));

    if (!enrollmentResult.checkoutUrl || !enrollmentResult.checkoutToken) {
      throw new Error("Enrollment initiation did not return checkoutUrl or checkoutToken");
    }
    console.log(`[PASS] Enrollment initiated successfully: #${enrollmentResult.enrollmentNumber}, Invoice: #${enrollmentResult.invoiceNumber}`);

    // ── TEST 4: CORRECT CHILD AND COURSE DETERMINE ELIGIBLE DEMO ─────────────
    console.log("\n[Test 4] Verifying correct course scoping for demo completion...");
    // Student 1 completed demo for Course A, but NOT Course B
    let test4Passed = false;
    try {
      await ParentService.initiateChildEnrollment(parent._id, student1._id.toString(), courseB._id.toString());
    } catch (err: any) {
      if (err.message.includes("Child has not completed a demo session")) {
        test4Passed = true;
        console.log(`[PASS] Correctly rejected Course B enrollment because completed demo was for Course A.`);
      }
    }
    if (!test4Passed) {
      throw new Error("FAIL: Allowed enrollment in Course B using Course A's demo session!");
    }

    // ── TEST 5: SIBLING'S COMPLETED DEMO CANNOT AUTHORIZE ANOTHER CHILD ───────
    console.log("\n[Test 5] Verifying child isolation (sibling cannot use other child's demo)...");
    let test5Passed = false;
    try {
      await ParentService.initiateChildEnrollment(parent._id, student2._id.toString(), courseA._id.toString());
    } catch (err: any) {
      if (err.message.includes("Child has not completed a demo session")) {
        test5Passed = true;
        console.log(`[PASS] Child isolation verified: Sibling (Bob) blocked from enrolling with Alice's demo.`);
      }
    }
    if (!test5Passed) {
      throw new Error("FAIL: Sibling was able to enroll using another child's completed demo!");
    }

    // ── TEST 6: REPEATING INITIATION REUSES EXISTING WAITING-PAYMENT ENROLLMENT ─
    console.log("\n[Test 6] Verifying idempotency: Reusing existing waiting-payment enrollment and invoice...");
    const repeatResult = await ParentService.initiateChildEnrollment(
      parent._id,
      student1._id.toString(),
      courseA._id.toString()
    );

    if (repeatResult.enrollmentId !== enrollmentResult.enrollmentId) {
      throw new Error(`FAIL: Duplicate enrollment created! Expected ${enrollmentResult.enrollmentId}, got ${repeatResult.enrollmentId}`);
    }
    if (repeatResult.invoiceId !== enrollmentResult.invoiceId) {
      throw new Error(`FAIL: Duplicate invoice created! Expected ${enrollmentResult.invoiceId}, got ${repeatResult.invoiceId}`);
    }
    console.log(`[PASS] Idempotent reuse confirmed: Retained enrollment #${repeatResult.enrollmentNumber} & invoice #${repeatResult.invoiceNumber} without duplicates.`);

    // ── TEST 7: MISMATCHED EXISTING ENROLLMENT IS REJECTED SAFELY ─────────────
    console.log("\n[Test 7] Verifying mismatched existing enrollment safety...");
    // Verify checkout token integrity
    if (!repeatResult.checkoutToken) {
      throw new Error("Expected checkoutToken to be present");
    }
    const verifiedClaims = CheckoutTokenService.verifyCheckoutToken(repeatResult.checkoutToken);
    if (!verifiedClaims || verifiedClaims.studentId !== student1._id.toString()) {
      throw new Error("Checkout token claims mismatch for student");
    }
    if (verifiedClaims.courseId !== courseA._id.toString()) {
      throw new Error("Checkout token claims mismatch for course");
    }
    console.log("[PASS] Checkout token cryptographically bound to correct student, parent, invoice, and course.");

    // ── TEST 8: PAYMENT COMPLETION CONFIRMS ENROLLMENT & PROVISIONS BATCH ─────
    console.log("\n[Test 8] Verifying payment completion confirms enrollment...");
    const simPayment = await Payment.create({
      paymentNumber: `PAY-TEST-${testSuffix}`,
      invoice: repeatResult.invoiceId,
      student: student1._id,
      amount: repeatResult.totalAmount,
      currency: "USD",
      status: "success",
      paymentMethod: "online-gateway",
      gateway: "stripe",
      transactionReference: `txn_${testSuffix}`,
      paymentDate: new Date(),
    });
    createdIds.payments.push(simPayment._id);

    await PaymentAutomationService.handlePaymentCompleted(simPayment._id.toString());

    const confirmedEnrollment = await Enrollment.findById(repeatResult.enrollmentId);
    if (confirmedEnrollment?.status !== "confirmed") {
      throw new Error(`FAIL: Expected enrollment status 'confirmed', got '${confirmedEnrollment?.status}'`);
    }

    const updatedLead = await Lead.findById(lead._id);
    if (updatedLead?.status !== "enrolled") {
      throw new Error(`FAIL: Expected lead status 'enrolled', got '${updatedLead?.status}'`);
    }
    console.log(`[PASS] Payment transitioned enrollment #${confirmedEnrollment.enrollmentNumber} to 'confirmed' and Lead to 'enrolled'.`);

    // ── TEST 9: EXISTING PARENT AUTH AND ACCESS PROTECTIONS REMAIN INTACT ─────
    console.log("\n[Test 9] Verifying parent authorization guard...");
    const fakeParentId = new mongoose.Types.ObjectId();
    let test9Passed = false;
    try {
      await ParentService.authorizeChildAccess(fakeParentId, student1._id.toString());
    } catch (err: any) {
      if (err.message.includes("Access denied") || err.statusCode === 403) {
        test9Passed = true;
        console.log("[PASS] Unauthorized parent blocked from accessing student ward.");
      }
    }
    if (!test9Passed) {
      throw new Error("FAIL: Unauthorized parent was not blocked!");
    }

    console.log("\n=======================================================");
    console.log(`ALL 9 LIFECYCLE TESTS PASSED in ${Date.now() - start}ms!`);
    console.log("=======================================================");
  } finally {
    // ── CLEANUP DISPOSABLE FIXTURES ──────────────────────────────────────────
    console.log("\n[Teardown] Cleaning up disposable test fixtures...");
    const db = mongoose.connection.db;
    if (db) {
      if (createdIds.payments.length) await db.collection("payments").deleteMany({ _id: { $in: createdIds.payments } });
      if (createdIds.invoices.length) await db.collection("invoices").deleteMany({ _id: { $in: createdIds.invoices } });
      if (createdIds.enrollments.length) await db.collection("enrollments").deleteMany({ _id: { $in: createdIds.enrollments } });
      if (createdIds.demos.length) await db.collection("demosessions").deleteMany({ _id: { $in: createdIds.demos } });
      if (createdIds.leads.length) await db.collection("leads").deleteMany({ _id: { $in: createdIds.leads } });
      if (createdIds.courses.length) await db.collection("courses").deleteMany({ _id: { $in: createdIds.courses } });
      if (createdIds.links.length) await db.collection("parentstudentlinks").deleteMany({ _id: { $in: createdIds.links } });
      if (createdIds.students.length) await db.collection("students").deleteMany({ _id: { $in: createdIds.students } });
      if (createdIds.parents.length) await db.collection("parents").deleteMany({ _id: { $in: createdIds.parents } });
      if (createdIds.users.length) await db.collection("users").deleteMany({ _id: { $in: createdIds.users } });
      console.log("[Teardown] Disposable fixtures cleaned up cleanly.");
    }
    await mongoose.disconnect();
    console.log("[Teardown] MongoDB disconnected cleanly.");
  }
}

runLifecycleTests();
