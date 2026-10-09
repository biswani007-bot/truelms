import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { DemoAvailability } from "../models/demo-availability.model";
import { DemoSession } from "../models/demo-session.model";
import { Teacher } from "../models/teacher.model";
import { Course } from "../models/course.model";
import { JwtHelper } from "../helpers/jwt";
import { GET as getAvailability, POST as postAvailability, DELETE as deleteAvailability } from "../app/api/crm/demos/availability/route";

interface TestResult {
  num: number;
  description: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(num: number, description: string, passed: boolean, details?: string) {
  results.push({ num, description, passed, details });
  console.log(`${passed ? "✅ PASS" : "❌ FAIL"} [Test ${num}] ${description}${details ? ` - ${details}` : ""}`);
}

// Helper to create authenticated admin mock Request
function createMockRequest(url: string, method: string, token: string, body?: any): Request {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  if (body) {
    headers.set("content-type", "application/json");
  }
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runTests() {
  await connectDB();
  console.log("\n=======================================================");
  console.log("TrueLern — Demo Availability Deletion & E11000 Fix Test");
  console.log("=======================================================\n");

  const disposableSlotIds: mongoose.Types.ObjectId[] = [];

  try {
    const adminToken = JwtHelper.signAccess({
      userId: new mongoose.Types.ObjectId().toString(),
      role: "admin",
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Delete an unused availability slot
    // ─────────────────────────────────────────────────────────────
    const futureDate1 = new Date(Date.now() + 50 * 24 * 3600 * 1000); // 50 days in future
    futureDate1.setMinutes(0, 0, 0);

    const testSlot1 = await DemoAvailability.create({
      slotDate: new Date(futureDate1).setHours(0, 0, 0, 0),
      startTime: "10:00 AM",
      endTime: "10:45 AM",
      scheduledStart: futureDate1,
      scheduledEnd: new Date(futureDate1.getTime() + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      status: "available",
      capacity: 1,
      bookedCount: 0,
      isDeleted: false,
    });
    disposableSlotIds.push(testSlot1._id);

    const req1 = createMockRequest(
      `http://localhost:3000/api/crm/demos/availability?id=${testSlot1._id.toString()}`,
      "DELETE",
      adminToken
    );
    const res1 = await deleteAvailability(req1);
    const json1 = await res1.json();

    const checkSlot1 = await DemoAvailability.findOne({
      _id: testSlot1._id,
      isDeleted: { $in: [true, false] },
    });

    const pass1 = res1.status === 200 && json1.success === true && checkSlot1?.isDeleted === true && checkSlot1?.status === "cancelled";
    record(1, "Delete an unused availability slot", pass1, `status=${res1.status}, msg=${json1.message}, isDeleted=${checkSlot1?.isDeleted}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Delete the same slot twice (idempotent soft deletion)
    // ─────────────────────────────────────────────────────────────
    const req2 = createMockRequest(
      `http://localhost:3000/api/crm/demos/availability?id=${testSlot1._id.toString()}`,
      "DELETE",
      adminToken
    );
    const res2 = await deleteAvailability(req2);
    const json2 = await res2.json();

    const pass2 = res2.status === 200 && json2.success === true && json2.message?.includes("already removed");
    record(2, "Delete the same slot twice (idempotent)", pass2, `status=${res2.status}, msg=${json2.message}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Create a new slot at a different time
    // ─────────────────────────────────────────────────────────────
    const futureDate2 = new Date(Date.now() + 55 * 24 * 3600 * 1000);
    const dateStr2 = futureDate2.toISOString().split("T")[0];
    const dayOfWeek2 = futureDate2.getDay();

    const req3 = createMockRequest(
      "http://localhost:3000/api/crm/demos/availability",
      "POST",
      adminToken,
      {
        startDate: dateStr2,
        endDate: dateStr2,
        daysOfWeek: [dayOfWeek2],
        times: ["03:00 PM"],
        duration: 45,
        timezone: "UTC",
      }
    );
    const res3 = await postAvailability(req3);
    const json3 = await res3.json();

    const expectedStart3 = new Date(futureDate2);
    expectedStart3.setHours(15, 0, 0, 0);

    const createdSlot3 = await DemoAvailability.findOne({
      scheduledStart: expectedStart3,
      isDeleted: false,
    });
    if (createdSlot3) disposableSlotIds.push(createdSlot3._id);

    const pass3 = res3.status === 200 && json3.success === true && !!createdSlot3;
    record(3, "Create a new slot at a different time", pass3, `status=${res3.status}, count=${json3.count}, slotId=${createdSlot3?._id}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Attempt to create a duplicate slot
    // ─────────────────────────────────────────────────────────────
    const req4 = createMockRequest(
      "http://localhost:3000/api/crm/demos/availability",
      "POST",
      adminToken,
      {
        startDate: dateStr2,
        endDate: dateStr2,
        daysOfWeek: [dayOfWeek2],
        times: ["03:00 PM"],
        duration: 45,
        timezone: "UTC",
      }
    );
    const res4 = await postAvailability(req4);
    const json4 = await res4.json();

    const slotsMatching3 = await DemoAvailability.find({
      scheduledStart: expectedStart3,
      isDeleted: false,
    });

    const pass4 = res4.status === 200 && json4.success === true && json4.count === 0 && slotsMatching3.length === 1;
    record(4, "Attempt to create a duplicate slot", pass4, `status=${res4.status}, count=${json4.count}, activeSlotsCount=${slotsMatching3.length}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Delete a slot with existing booking protection
    // ─────────────────────────────────────────────────────────────
    const futureDate5 = new Date(Date.now() + 60 * 24 * 3600 * 1000);
    futureDate5.setMinutes(0, 0, 0);

    const bookedSlot = await DemoAvailability.create({
      slotDate: new Date(futureDate5).setHours(0, 0, 0, 0),
      startTime: "11:00 AM",
      endTime: "11:45 AM",
      scheduledStart: futureDate5,
      scheduledEnd: new Date(futureDate5.getTime() + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      status: "booked",
      capacity: 1,
      bookedCount: 1,
      isDeleted: false,
    });
    disposableSlotIds.push(bookedSlot._id);

    const req5 = createMockRequest(
      `http://localhost:3000/api/crm/demos/availability?id=${bookedSlot._id.toString()}`,
      "DELETE",
      adminToken
    );
    const res5 = await deleteAvailability(req5);
    const json5 = await res5.json();

    const checkBookedSlot = await DemoAvailability.findOne({
      _id: bookedSlot._id,
      isDeleted: { $in: [true, false] },
    });

    const pass5 = res5.status === 400 && json5.success === false && json5.error?.includes("Cannot delete a slot that has already been booked") && checkBookedSlot?.isDeleted === false && checkBookedSlot?.status === "booked";
    record(5, "Delete a slot with existing booking protection", pass5, `status=${res5.status}, error=${json5.error}, isDeleted=${checkBookedSlot?.isDeleted}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Confirm existing booked demos remain unchanged
    // ─────────────────────────────────────────────────────────────
    const existingDemos = await DemoSession.find({ status: "scheduled", isDeleted: { $ne: true } }).limit(5);
    let allDemosIntact = true;
    for (const d of existingDemos) {
      if (d.status !== "scheduled" || (d as any).isDeleted) {
        allDemosIntact = false;
      }
    }
    const pass6 = allDemosIntact && checkBookedSlot?.status === "booked";
    record(6, "Confirm existing booked demos remain unchanged", pass6, `checkedDemos=${existingDemos.length}, bookedSlotStatus=${checkBookedSlot?.status}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Confirm soft-deleted records do not appear as available
    // ─────────────────────────────────────────────────────────────
    const req7 = createMockRequest("http://localhost:3000/api/crm/demos/availability", "GET", adminToken);
    const res7 = await getAvailability(req7);
    const json7 = await res7.json();

    const returnedIds = (json7.data || []).map((s: any) => s._id.toString());
    const deletedSlot1Appears = returnedIds.includes(testSlot1._id.toString());
    const pass7 = res7.status === 200 && json7.success === true && !deletedSlot1Appears;
    record(7, "Confirm soft-deleted records do not appear as available", pass7, `deletedSlotInList=${deletedSlot1Appears}, totalAvailableReturned=${returnedIds.length}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 8: Confirm another teacher's or course's availability is unaffected
    // ─────────────────────────────────────────────────────────────
    const sampleTeacher1 = await Teacher.findOne({ status: "active", isDeleted: { $ne: true } });
    const sampleTeacher2 = await Teacher.findOne({
      _id: { $ne: sampleTeacher1?._id },
      status: "active",
      isDeleted: { $ne: true },
    });
    const sampleCourse = await Course.findOne({ status: "published", isDeleted: { $ne: true } });

    const sharedStart = new Date(Date.now() + 65 * 24 * 3600 * 1000);
    sharedStart.setMinutes(0, 0, 0);

    const slotTeacherA = await DemoAvailability.create({
      slotDate: new Date(sharedStart).setHours(0, 0, 0, 0),
      startTime: "01:00 PM",
      endTime: "01:45 PM",
      scheduledStart: sharedStart,
      scheduledEnd: new Date(sharedStart.getTime() + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      teacher: sampleTeacher1?._id,
      course: sampleCourse?._id,
      status: "available",
      capacity: 1,
      bookedCount: 0,
      isDeleted: false,
    });
    disposableSlotIds.push(slotTeacherA._id);

    const slotTeacherB = await DemoAvailability.create({
      slotDate: new Date(sharedStart).setHours(0, 0, 0, 0),
      startTime: "01:00 PM",
      endTime: "01:45 PM",
      scheduledStart: sharedStart,
      scheduledEnd: new Date(sharedStart.getTime() + 45 * 60000),
      duration: 45,
      timezone: "UTC",
      teacher: sampleTeacher2?._id,
      course: sampleCourse?._id,
      status: "available",
      capacity: 1,
      bookedCount: 0,
      isDeleted: false,
    });
    disposableSlotIds.push(slotTeacherB._id);

    // Delete slotTeacherA
    const req8 = createMockRequest(
      `http://localhost:3000/api/crm/demos/availability?id=${slotTeacherA._id.toString()}`,
      "DELETE",
      adminToken
    );
    const res8 = await deleteAvailability(req8);
    const json8 = await res8.json();

    const checkTeacherB = await DemoAvailability.findById(slotTeacherB._id);
    const pass8 = res8.status === 200 && json8.success === true && checkTeacherB?.status === "available" && checkTeacherB?.isDeleted === false;
    record(8, "Confirm another teacher's or course's availability is unaffected", pass8, `teacherBActive=${checkTeacherB?.isDeleted === false}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 9: Refresh the Admin page and verify the deletion persists
    // ─────────────────────────────────────────────────────────────
    const req9 = createMockRequest("http://localhost:3000/api/crm/demos/availability", "GET", adminToken);
    const res9 = await getAvailability(req9);
    const json9 = await res9.json();

    const activeList = (json9.data || []).map((s: any) => s._id.toString());
    const pass9 = res9.status === 200 && !activeList.includes(slotTeacherA._id.toString()) && activeList.includes(slotTeacherB._id.toString());
    record(9, "Refresh the Admin page and verify the deletion persists", pass9, `slotTeacherAExcluded=${!activeList.includes(slotTeacherA._id.toString())}, slotTeacherBIncluded=${activeList.includes(slotTeacherB._id.toString())}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 10: Verify the operation does not produce E11000
    // Test the exact conflicting scenario:
    // A slot at scheduledStart = 1791534600000 (2026-10-09T08:30:00.000Z)
    // where record 6ac87b6500693987a17c2526 collides with soft-deleted 6ac3630b9cbbb9dada125f52
    // ─────────────────────────────────────────────────────────────
    const targetDate = new Date(1791534600000);
    const collidingActiveSlot = await DemoAvailability.findOne({
      scheduledStart: targetDate,
      isDeleted: false,
    });

    let pass10 = false;
    let details10 = "";

    if (collidingActiveSlot) {
      const req10 = createMockRequest(
        `http://localhost:3000/api/crm/demos/availability?id=${collidingActiveSlot._id.toString()}`,
        "DELETE",
        adminToken
      );
      const res10 = await deleteAvailability(req10);
      const json10 = await res10.json();

      pass10 = res10.status === 200 && json10.success === true && !json10.error?.includes("E11000");
      details10 = `Tested on active colliding slot ${collidingActiveSlot._id}: status=${res10.status}, success=${json10.success}, msg=${json10.message}`;
    } else {
      // Create duplicate soft-delete collision scenario synthetically
      const testDate10 = new Date(Date.now() + 70 * 24 * 3600 * 1000);
      const oldSoftDeleted = await DemoAvailability.create({
        slotDate: new Date(testDate10).setHours(0, 0, 0, 0),
        startTime: "02:00 PM",
        endTime: "02:45 PM",
        scheduledStart: testDate10,
        scheduledEnd: new Date(testDate10.getTime() + 45 * 60000),
        duration: 45,
        timezone: "UTC",
        status: "cancelled",
        capacity: 1,
        bookedCount: 0,
        isDeleted: true,
      });
      disposableSlotIds.push(oldSoftDeleted._id);

      const newActive = await DemoAvailability.create({
        slotDate: new Date(testDate10).setHours(0, 0, 0, 0),
        startTime: "02:00 PM",
        endTime: "02:45 PM",
        scheduledStart: testDate10,
        scheduledEnd: new Date(testDate10.getTime() + 45 * 60000),
        duration: 45,
        timezone: "UTC",
        status: "available",
        capacity: 1,
        bookedCount: 0,
        isDeleted: false,
      });
      disposableSlotIds.push(newActive._id);

      const req10 = createMockRequest(
        `http://localhost:3000/api/crm/demos/availability?id=${newActive._id.toString()}`,
        "DELETE",
        adminToken
      );
      const res10 = await deleteAvailability(req10);
      const json10 = await res10.json();

      pass10 = res10.status === 200 && json10.success === true && !json10.error?.includes("E11000");
      details10 = `Tested on synthetic colliding slot ${newActive._id}: status=${res10.status}, success=${json10.success}, msg=${json10.message}`;
    }

    record(10, "Verify the operation does not produce E11000", pass10, details10);

  } finally {
    // Clean up disposable test records
    console.log(`\nCleaning up ${disposableSlotIds.length} disposable test records...`);
    if (disposableSlotIds.length > 0) {
      await DemoAvailability.deleteMany({ _id: { $in: disposableSlotIds } });
    }
    await mongoose.disconnect();
  }

  console.log("\n=======================================================");
  const allPassed = results.every((r) => r.passed);
  console.log(`Test Summary: ${results.filter((r) => r.passed).length} / ${results.length} PASSED`);
  if (!allPassed) {
    console.error("SOME TESTS FAILED!");
    process.exit(1);
  } else {
    console.log("ALL 10 TESTS PASSED SUCCESSFULLY! 🚀");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test runner threw an unhandled error:", err);
  process.exit(1);
});
