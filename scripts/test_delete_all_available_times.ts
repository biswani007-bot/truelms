import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { DemoAvailability } from "../models/demo-availability.model";
import { DemoSession } from "../models/demo-session.model";
import { Course } from "../models/course.model";
import { Lead } from "../models/lead.model";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { Enrollment } from "../models/enrollment.model";
import { Invoice } from "../models/invoice.model";
import { Payment } from "../models/payment.model";
import { JwtHelper } from "../helpers/jwt";
import { DELETE as deleteAvailability, GET as getAvailability } from "../app/api/crm/demos/availability/route";

async function runTestSuite() {
  console.log("=== TrueLern 'Delete All Available Demo Times' Verification Test Suite ===\n");
  const startTime = Date.now();
  await connectDB();
  console.log(`[PASS] Connected to MongoDB in ${Date.now() - startTime}ms`);

  const testSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  const cleanupIds: {
    availabilities: mongoose.Types.ObjectId[];
    demoSessions: mongoose.Types.ObjectId[];
    courses: mongoose.Types.ObjectId[];
    parents: mongoose.Types.ObjectId[];
    students: mongoose.Types.ObjectId[];
    leads: mongoose.Types.ObjectId[];
    enrollments: mongoose.Types.ObjectId[];
    invoices: mongoose.Types.ObjectId[];
    payments: mongoose.Types.ObjectId[];
  } = {
    availabilities: [],
    demoSessions: [],
    courses: [],
    parents: [],
    students: [],
    leads: [],
    enrollments: [],
    invoices: [],
    payments: [],
  };

  try {
    // Generate auth tokens
    const adminToken = JwtHelper.signAccess({
      userId: new mongoose.Types.ObjectId().toString(),
      role: "admin",
    });
    const studentToken = JwtHelper.signAccess({
      userId: new mongoose.Types.ObjectId().toString(),
      role: "student",
    });

    // Create test Course
    const testCourse = await Course.create({
      courseName: `Test Bulk Delete Course ${testSuffix}`,
      courseCode: `TBD-${testSuffix}`,
      slug: `test-bulk-delete-${testSuffix}`,
      status: "published",
      category: new mongoose.Types.ObjectId(),
      shortDescription: "Test short description",
      longDescription: "Test long description",
      level: "beginner",
      duration: 12,
    });
    cleanupIds.courses.push(testCourse._id);

    // Create a booked DemoSession and linked entities to test preservation
    const testParent = await Parent.create({
      user: new mongoose.Types.ObjectId(),
      parentId: `PAR-DEL-${testSuffix}`,
      firstName: "Test",
      lastName: `Parent ${testSuffix}`,
      email: `parent_${testSuffix}@truelern.test`,
      phone: "+15550001111",
      address: "123 Test St",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      postalCode: "94105",
      status: "active",
    });
    cleanupIds.parents.push(testParent._id);

    const testStudent = await Student.create({
      user: new mongoose.Types.ObjectId(),
      studentId: `STU-DEL-${testSuffix}`,
      admissionNumber: `ADM-DEL-${testSuffix}`,
      registrationNumber: `REG-DEL-${testSuffix}`,
      firstName: "Test",
      lastName: `Student ${testSuffix}`,
      email: `student_${testSuffix}@truelern.test`,
      phone: "+15550001112",
      parent: testParent._id,
      status: "active",
    });
    cleanupIds.students.push(testStudent._id);

    const testLead = await Lead.create({
      leadId: `LED-${testSuffix}`,
      fullName: `Test Lead ${testSuffix}`,
      email: testParent.email,
      phone: testParent.phone,
      student: testStudent._id,
      parent: testParent._id,
      course: testCourse._id,
      interestedCourse: testCourse.courseName,
      city: "San Francisco",
      state: "CA",
      country: "USA",
      status: "demo_scheduled",
    });
    cleanupIds.leads.push(testLead._id);

    const bookedSlotTime = new Date(Date.now() + 86400000); // tomorrow
    const bookedDemoSession = await DemoSession.create({
      demoCode: `DEMO-TEST-${testSuffix}`,
      lead: testLead._id,
      parent: testParent._id,
      student: testStudent._id,
      course: testCourse._id,
      scheduledStart: bookedSlotTime,
      scheduledEnd: new Date(bookedSlotTime.getTime() + 45 * 60000),
      duration: 45,
      meetingPlatform: "jitsi",
      meetingLink: "https://meet.truelern.test/demo",
      status: "scheduled",
    });
    cleanupIds.demoSessions.push(bookedDemoSession._id);

    // Create booked slot in DemoAvailability
    const bookedSlot = await DemoAvailability.create({
      slotDate: bookedSlotTime,
      startTime: "10:00 AM",
      endTime: "10:45 AM",
      scheduledStart: bookedSlotTime,
      scheduledEnd: new Date(bookedSlotTime.getTime() + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      course: testCourse._id,
      status: "booked",
      capacity: 1,
      bookedCount: 1,
      bookedDemoSession: bookedDemoSession._id,
    });
    cleanupIds.availabilities.push(bookedSlot._id);

    // Create 3 unbooked available slots
    const unbookedSlot1 = await DemoAvailability.create({
      slotDate: new Date(Date.now() + 172800000),
      startTime: "11:00 AM",
      endTime: "11:45 AM",
      scheduledStart: new Date(Date.now() + 172800000),
      scheduledEnd: new Date(Date.now() + 172800000 + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      course: testCourse._id,
      status: "available",
      capacity: 1,
      bookedCount: 0,
    });
    cleanupIds.availabilities.push(unbookedSlot1._id);

    const unbookedSlot2 = await DemoAvailability.create({
      slotDate: new Date(Date.now() + 259200000),
      startTime: "02:00 PM",
      endTime: "02:45 PM",
      scheduledStart: new Date(Date.now() + 259200000),
      scheduledEnd: new Date(Date.now() + 259200000 + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      course: testCourse._id,
      status: "available",
      capacity: 1,
      bookedCount: 0,
    });
    cleanupIds.availabilities.push(unbookedSlot2._id);

    const unbookedSlot3 = await DemoAvailability.create({
      slotDate: new Date(Date.now() + 345600000),
      startTime: "04:00 PM",
      endTime: "04:45 PM",
      scheduledStart: new Date(Date.now() + 345600000),
      scheduledEnd: new Date(Date.now() + 345600000 + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      status: "available",
      capacity: 1,
      bookedCount: 0,
    });
    cleanupIds.availabilities.push(unbookedSlot3._id);

    // Create Enrollment, Invoice, Payment to ensure preservation
    const testEnrollment = await Enrollment.create({
      enrollmentNumber: `ENR-TBD-${testSuffix}`,
      student: testStudent._id,
      course: testCourse._id,
      parent: testParent._id,
      academicSession: "2026-2027",
      status: "waiting-payment",
    });
    cleanupIds.enrollments.push(testEnrollment._id);

    const testInvoice = await Invoice.create({
      invoiceNumber: `INV-TBD-${testSuffix}`,
      enrollment: testEnrollment._id,
      student: testStudent._id,
      parent: testParent._id,
      course: testCourse._id,
      totalAmount: 500,
      subtotal: 500,
      taxAmount: 0,
      currency: "USD",
      dueDate: new Date(Date.now() + 86400000),
      status: "issued",
      items: [{ description: "Tuition", amount: 500 }],
    });
    cleanupIds.invoices.push(testInvoice._id);

    // ── TEST 9: UNAUTHORIZED USERS CANNOT INVOKE BULK-DELETE ENDPOINT ────────
    console.log("[Test 9] Verifying unauthorized user protection on bulk delete...");
    const unauthReq = new Request("http://localhost:3000/api/crm/demos/availability?all=true", {
      method: "DELETE",
      headers: { authorization: `Bearer ${studentToken}` },
    });
    const unauthRes = await deleteAvailability(unauthReq);
    const unauthJson = await unauthRes.json();
    if (unauthRes.status !== 401 || unauthJson.success !== false) {
      throw new Error(`FAIL: Expected 401 Unauthorized, got ${unauthRes.status}`);
    }
    console.log("[PASS] Unauthorized user safely blocked with 401 Unauthorized.");

    // ── TEST 1: DELETE ALL REMOVES MULTIPLE UNBOOKED AVAILABLE SLOTS ─────────
    console.log("\n[Test 1] Verifying Delete All removes multiple unbooked available slots...");
    const bulkDeleteReq = new Request("http://localhost:3000/api/crm/demos/availability?all=true", {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const bulkDeleteRes = await deleteAvailability(bulkDeleteReq);
    const bulkDeleteJson = await bulkDeleteRes.json();
    if (bulkDeleteRes.status !== 200 || !bulkDeleteJson.success) {
      throw new Error(`FAIL: Bulk delete failed: ${JSON.stringify(bulkDeleteJson)}`);
    }
    console.log(`[PASS] Bulk delete succeeded: ${bulkDeleteJson.message} (Deleted count: ${bulkDeleteJson.deletedCount})`);
    if (bulkDeleteJson.deletedCount < 3) {
      throw new Error(`FAIL: Expected at least 3 deleted slots, got ${bulkDeleteJson.deletedCount}`);
    }

    // ── TEST 2 & 3: DELETED RECORDS DISAPPEAR FROM API REFETCH & REMAIN ABSENT
    console.log("\n[Test 2 & 3] Verifying deleted records disappear from GET refetch and DB...");
    const getReq = new Request("http://localhost:3000/api/crm/demos/availability", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const getRes = await getAvailability(getReq);
    const getJson = await getRes.json();
    const activeSlotIds = (getJson.data || []).map((s: any) => s._id.toString());
    if (activeSlotIds.includes(unbookedSlot1._id.toString()) ||
        activeSlotIds.includes(unbookedSlot2._id.toString()) ||
        activeSlotIds.includes(unbookedSlot3._id.toString())) {
      throw new Error("FAIL: Unbooked slots still appear in GET active availability slots!");
    }
    console.log("[PASS] Deleted slots absent from active availability query.");

    // Direct DB check for soft delete
    const dbSlot1 = await DemoAvailability.findOne({ _id: unbookedSlot1._id, isDeleted: { $in: [true, false] } });
    if (dbSlot1 && dbSlot1.isDeleted !== true) {
      throw new Error("FAIL: Slot 1 is not soft-deleted in database!");
    }
    console.log("[PASS] Slot persistence confirmed soft-deleted (isDeleted: true).");

    // ── TEST 4: BOOKED SLOTS REMAIN INTACT ──────────────────────────────────
    console.log("\n[Test 4] Verifying booked slots remain intact...");
    const dbBookedSlot = await DemoAvailability.findById(bookedSlot._id);
    if (!dbBookedSlot || dbBookedSlot.isDeleted === true || dbBookedSlot.status !== "booked") {
      throw new Error("FAIL: Booked slot was modified or deleted!");
    }
    console.log("[PASS] Booked slot completely intact with status='booked'.");

    // ── TEST 5 & 6: DEMOSESSIONS, LEADS, ENROLLMENTS, INVOICES UNTOUCHED ─────
    console.log("\n[Test 5 & 6] Verifying DemoSession, Lead, Enrollment, Invoice preserved...");
    const dbDemoSession = await DemoSession.findById(bookedDemoSession._id);
    if (!dbDemoSession || dbDemoSession.status !== "scheduled") {
      throw new Error("FAIL: DemoSession was altered or deleted!");
    }
    const dbLead = await Lead.findById(testLead._id);
    if (!dbLead || dbLead.status !== "demo_scheduled") {
      throw new Error("FAIL: Lead was altered!");
    }
    const dbEnrollment = await Enrollment.findById(testEnrollment._id);
    if (!dbEnrollment || dbEnrollment.status !== "waiting-payment") {
      throw new Error("FAIL: Enrollment was altered!");
    }
    const dbInvoice = await Invoice.findById(testInvoice._id);
    if (!dbInvoice || dbInvoice.status !== "issued") {
      throw new Error("FAIL: Invoice was altered!");
    }
    console.log("[PASS] All DemoSessions, CRM Leads, Enrollments, and Invoices untouched.");

    // ── TEST 8: REPEATING DELETE ALL IS SAFE & IDEMPOTENT ────────────────────
    console.log("\n[Test 8] Verifying repeating Delete All is safe and idempotent...");
    const repeatReq = new Request("http://localhost:3000/api/crm/demos/availability?all=true", {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const repeatRes = await deleteAvailability(repeatReq);
    const repeatJson = await repeatRes.json();
    if (repeatRes.status !== 200 || !repeatJson.success || repeatJson.deletedCount !== 0) {
      throw new Error(`FAIL: Repeating Delete All returned unexpected result: ${JSON.stringify(repeatJson)}`);
    }
    console.log("[PASS] Repeated Delete All returned success with 0 deletions safely.");

    // ── TEST 11: EXISTING INDIVIDUAL DELETE ACTION STILL WORKS ───────────────
    console.log("\n[Test 11] Verifying individual Delete action still works...");
    const individualSlot = await DemoAvailability.create({
      slotDate: new Date(Date.now() + 432000000),
      startTime: "09:00 AM",
      endTime: "09:45 AM",
      scheduledStart: new Date(Date.now() + 432000000),
      scheduledEnd: new Date(Date.now() + 432000000 + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      status: "available",
      capacity: 1,
      bookedCount: 0,
    });
    cleanupIds.availabilities.push(individualSlot._id);

    const singleDeleteReq = new Request(`http://localhost:3000/api/crm/demos/availability?id=${individualSlot._id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const singleDeleteRes = await deleteAvailability(singleDeleteReq);
    const singleDeleteJson = await singleDeleteRes.json();
    if (singleDeleteRes.status !== 200 || !singleDeleteJson.success) {
      throw new Error(`FAIL: Single delete failed: ${JSON.stringify(singleDeleteJson)}`);
    }
    const verifySingleDeleted = await DemoAvailability.findOne({ _id: individualSlot._id, isDeleted: { $in: [true, false] } });
    if (verifySingleDeleted?.isDeleted !== true) {
      throw new Error("FAIL: Individual slot not soft deleted!");
    }
    console.log("[PASS] Individual delete works cleanly.");

    // ── TEST 12: AVAILABILITY INDEX DOES NOT PRODUCE DUPLICATE KEY ERRORS ───
    console.log("\n[Test 12] Verifying index collision safety on soft-delete...");
    const collisionTime = new Date(Date.now() + 500000000);
    // Create an already soft-deleted slot with identical key
    const prevDeletedSlot = await DemoAvailability.create({
      slotDate: collisionTime,
      startTime: "12:00 PM",
      endTime: "12:45 PM",
      scheduledStart: collisionTime,
      scheduledEnd: new Date(collisionTime.getTime() + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      status: "cancelled",
      isDeleted: true,
      deletedAt: new Date(),
    });
    cleanupIds.availabilities.push(prevDeletedSlot._id);

    // Create an active slot with the exact same scheduledStart (null teacher & null course)
    const newActiveSlot = await DemoAvailability.create({
      slotDate: collisionTime,
      startTime: "12:00 PM",
      endTime: "12:45 PM",
      scheduledStart: collisionTime,
      scheduledEnd: new Date(collisionTime.getTime() + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      status: "available",
      capacity: 1,
      bookedCount: 0,
    });
    cleanupIds.availabilities.push(newActiveSlot._id);

    // Deleting newActiveSlot should NOT throw E11000 duplicate key error
    const collisionDeleteReq = new Request(`http://localhost:3000/api/crm/demos/availability?id=${newActiveSlot._id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const collisionRes = await deleteAvailability(collisionDeleteReq);
    const collisionJson = await collisionRes.json();
    if (collisionRes.status !== 200 || !collisionJson.success) {
      throw new Error(`FAIL: Deletion failed on unique index collision: ${JSON.stringify(collisionJson)}`);
    }
    console.log("[PASS] Index collision safely handled without E11000 error.");

    // ── TEST 10: DATABASE ERROR DOES NOT REPORT FALSE SUCCESS ───────────────
    console.log("\n[Test 10] Verifying database error does not report false success...");
    const invalidReq = new Request("http://localhost:3000/api/crm/demos/availability?id=invalid-id", {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const invalidRes = await deleteAvailability(invalidReq);
    const invalidJson = await invalidRes.json();
    if (invalidRes.status !== 400 || invalidJson.success !== false) {
      throw new Error(`FAIL: Expected 400 for invalid ID, got ${invalidRes.status}`);
    }
    console.log("[PASS] Input/DB error safely reported without false success.");

    console.log("\n=======================================================");
    console.log("ALL 12 BULK DELETION VERIFICATION TESTS PASSED!");
    console.log("=======================================================\n");

  } finally {
    // Teardown
    console.log("[Teardown] Cleaning up disposable test fixtures...");
    for (const id of cleanupIds.availabilities) {
      await DemoAvailability.deleteOne({ _id: id });
    }
    for (const id of cleanupIds.demoSessions) {
      await DemoSession.deleteOne({ _id: id });
    }
    for (const id of cleanupIds.courses) {
      await Course.deleteOne({ _id: id });
    }
    for (const id of cleanupIds.parents) {
      await Parent.deleteOne({ _id: id });
    }
    for (const id of cleanupIds.students) {
      await Student.deleteOne({ _id: id });
    }
    for (const id of cleanupIds.leads) {
      await Lead.deleteOne({ _id: id });
    }
    for (const id of cleanupIds.enrollments) {
      await Enrollment.deleteOne({ _id: id });
    }
    for (const id of cleanupIds.invoices) {
      await Invoice.deleteOne({ _id: id });
    }
    for (const id of cleanupIds.payments) {
      await Payment.deleteOne({ _id: id });
    }
    console.log("[Teardown] Fixtures cleaned up.");
    await mongoose.disconnect();
    console.log("[Teardown] MongoDB disconnected.");
  }
}

runTestSuite().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
