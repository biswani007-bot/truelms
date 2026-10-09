import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/user.model";
import { Teacher } from "../models/teacher.model";
import { Student } from "../models/student.model";
import { Course } from "../models/course.model";
import { Cohort } from "../models/cohort.model";
import { AcademicSession } from "../models/academic-session.model";
import { Batch } from "../models/batch.model";
import { BatchTeacher } from "../models/batch-teacher.model";
import { BatchStudent } from "../models/batch-student.model";
import { Enrollment } from "../models/enrollment.model";
import { Invoice } from "../models/invoice.model";
import { JwtHelper } from "../helpers/jwt";
import { POST as createBatch, GET as getBatches } from "../app/api/batches/route";
import { AcademicResolver } from "../services/academic/academic.service";
import { EnrollmentAutomationService } from "../services/automation/enrollment-automation.service";
import { NextRequest } from "next/server";

async function runTests() {
  console.log("=== TrueLern Admin Batch Creation & Cohort Binding Test Suite ===\n");
  const startTime = Date.now();
  await connectDB();
  console.log(`[PASS] Connected to MongoDB in ${Date.now() - startTime}ms`);

  const testSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  const cleanupIds: {
    users: mongoose.Types.ObjectId[];
    teachers: mongoose.Types.ObjectId[];
    students: mongoose.Types.ObjectId[];
    courses: mongoose.Types.ObjectId[];
    cohorts: mongoose.Types.ObjectId[];
    academicSessions: mongoose.Types.ObjectId[];
    batches: mongoose.Types.ObjectId[];
    batchTeachers: mongoose.Types.ObjectId[];
    batchStudents: mongoose.Types.ObjectId[];
    enrollments: mongoose.Types.ObjectId[];
    invoices: mongoose.Types.ObjectId[];
  } = {
    users: [],
    teachers: [],
    students: [],
    courses: [],
    cohorts: [],
    academicSessions: [],
    batches: [],
    batchTeachers: [],
    batchStudents: [],
    enrollments: [],
    invoices: [],
  };

  try {
    // 0. Setup Tokens
    const adminToken = JwtHelper.signAccess({
      userId: new mongoose.Types.ObjectId().toString(),
      role: "admin",
    });
    const studentToken = JwtHelper.signAccess({
      userId: new mongoose.Types.ObjectId().toString(),
      role: "student",
    });

    // 1. Setup Academic Session
    let session = await AcademicSession.findOne({ status: "active" });
    if (!session) {
      session = await AcademicSession.create({
        name: `Session ${testSuffix}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 3600000),
        status: "active",
      });
      cleanupIds.academicSessions.push(session._id);
    }

    // 2. Setup Teacher
    const teacherUser = await User.create({
      firstName: "Professor",
      lastName: `Admin${testSuffix}`,
      email: `prof_batch_${testSuffix}@truelern.test`,
      password: "TestPassword123!",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"),
    });
    cleanupIds.users.push(teacherUser._id);

    const teacher = await Teacher.create({
      user: teacherUser._id,
      employeeId: `EMP-${testSuffix}`,
      teacherCode: `TCH-${testSuffix}`,
      firstName: "Professor",
      lastName: `Admin${testSuffix}`,
      status: "active",
      gender: "male",
      dob: new Date("1985-05-15"),
      phone: "+15559876543",
      address: "456 Academy Way",
      city: "Boston",
      state: "MA",
      country: "USA",
      postalCode: "02108",
      nationality: "American",
      designation: "Lead Robotics Mentor",
      department: "STEM",
      joiningDate: new Date(),
      employmentType: "full-time",
      experienceYears: 8,
      qualifications: ["M.S. Robotics"],
      skills: ["Robotics", "Python"],
      languages: ["en"],
      isCounsellor: false,
    });
    cleanupIds.teachers.push(teacher._id);

    // 3. Setup Course A and Course B
    const courseA = await Course.create({
      courseName: `Future-Ready Robotics A ${testSuffix}`,
      courseCode: `FRB-A-${testSuffix}`,
      slug: `future-ready-robotics-a-${testSuffix}`,
      category: new mongoose.Types.ObjectId(),
      shortDescription: "Course A short description",
      longDescription: "Course A long description",
      duration: 16,
      durationUnit: "weeks",
      level: "beginner",
      status: "published",
      difficulty: "easy",
      deliveryMode: "live-cohort",
      certificateAvailable: true,
      featured: true,
      version: "1.0",
      requirements: {},
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
      durationUnit: "weeks",
      level: "beginner",
      status: "published",
      difficulty: "easy",
      deliveryMode: "live-cohort",
      certificateAvailable: true,
      featured: false,
      version: "1.0",
      requirements: {},
      pricing: { price: 300, discountPrice: 250, currency: "USD", taxPercentage: 10 },
    });
    cleanupIds.courses.push(courseB._id);

    // 4. Setup Cohorts
    const cohortA = await Cohort.create({
      cohortCode: `COH-A-${testSuffix}`,
      cohortName: `Robotics Alpha Cohort ${testSuffix}`,
      course: courseA._id,
      academicSession: session._id,
      startDate: new Date("2026-11-01"),
      endDate: new Date("2027-02-28"),
      enrollmentStart: new Date("2026-10-01"),
      enrollmentEnd: new Date("2026-10-31"),
      maxCapacity: 60,
      minCapacity: 5,
      language: "en",
      timezone: "America/New_York",
      primaryInstructor: teacher._id,
      status: "enrollment-open",
    });
    cleanupIds.cohorts.push(cohortA._id);

    const cohortB = await Cohort.create({
      cohortCode: `COH-B-${testSuffix}`,
      cohortName: `Design Beta Cohort ${testSuffix}`,
      course: courseB._id,
      academicSession: session._id,
      startDate: new Date("2026-11-15"),
      endDate: new Date("2027-03-15"),
      enrollmentStart: new Date("2026-10-01"),
      enrollmentEnd: new Date("2026-11-10"),
      maxCapacity: 40,
      minCapacity: 5,
      language: "en",
      timezone: "America/New_York",
      primaryInstructor: teacher._id,
      status: "enrollment-open",
    });
    cleanupIds.cohorts.push(cohortB._id);

    // ── TEST 1: AUTHORIZED ADMINISTRATOR CAN CREATE A BATCH ───────────────────
    console.log("[Test 1] Verifying authorized administrator can create a batch...");
    const createReq1 = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        course: courseA._id.toString(),
        cohort: cohortA._id.toString(),
        batchName: `Batch 1 Alpha ${testSuffix}`,
        capacity: 45,
        startDate: "2026-11-01",
        primaryTeacher: teacher._id.toString(),
      }),
    });

    const createRes1 = await createBatch(createReq1);
    const createJson1 = await createRes1.json();

    if (createRes1.status !== 201 || !createJson1.success || !createJson1.data) {
      throw new Error(`FAIL: Expected 201, got ${createRes1.status} - ${JSON.stringify(createJson1)}`);
    }

    const createdBatch1 = createJson1.data;
    cleanupIds.batches.push(new mongoose.Types.ObjectId(createdBatch1.id || createdBatch1._id));

    if (createdBatch1.maxCapacity !== 45) {
      throw new Error(`FAIL: Expected capacity 45, got ${createdBatch1.maxCapacity}`);
    }
    if (!createdBatch1.batchCode || !createdBatch1.batchCode.startsWith("BTH-")) {
      throw new Error(`FAIL: Invalid generated batch code ${createdBatch1.batchCode}`);
    }

    // Verify BatchTeacher record was created
    const btRecord = await BatchTeacher.findOne({
      batch: createdBatch1.id || createdBatch1._id,
      teacher: teacher._id,
      status: "active",
    });
    if (!btRecord) {
      throw new Error("FAIL: BatchTeacher record not found for primaryTeacher!");
    }
    cleanupIds.batchTeachers.push(btRecord._id);

    console.log(`[PASS] Batch created: ${createdBatch1.batchCode} - "${createdBatch1.batchName}" with capacity ${createdBatch1.maxCapacity}`);

    // ── TEST 2: INVALID COURSE OR COHORT IS REJECTED ──────────────────────────
    console.log("\n[Test 2] Verifying invalid course or cohort is rejected...");
    const fakeId = new mongoose.Types.ObjectId().toString();

    // Fake course
    const reqFakeCourse = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        course: fakeId,
        cohort: cohortA._id.toString(),
        batchName: "Invalid Course Test",
      }),
    });
    const resFakeCourse = await createBatch(reqFakeCourse);
    if (resFakeCourse.status !== 404 && resFakeCourse.status !== 400) {
      throw new Error(`FAIL: Expected 400/404 for non-existent course, got ${resFakeCourse.status}`);
    }

    // Fake cohort
    const reqFakeCohort = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        course: courseA._id.toString(),
        cohort: fakeId,
        batchName: "Invalid Cohort Test",
      }),
    });
    const resFakeCohort = await createBatch(reqFakeCohort);
    if (resFakeCohort.status !== 404 && resFakeCohort.status !== 400) {
      throw new Error(`FAIL: Expected 400/404 for non-existent cohort, got ${resFakeCohort.status}`);
    }
    console.log("[PASS] Correctly rejected invalid course and cohort.");

    // ── TEST 3: COHORT BELONGING TO A DIFFERENT COURSE IS REJECTED ────────────
    console.log("\n[Test 3] Verifying mismatched course-cohort relationship is rejected...");
    const reqMismatch = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        course: courseA._id.toString(), // Course A
        cohort: cohortB._id.toString(), // Cohort B (belongs to Course B!)
        batchName: "Cross-Course Mismatch Test",
        capacity: 30,
        startDate: "2026-11-01",
      }),
    });
    const resMismatch = await createBatch(reqMismatch);
    const jsonMismatch = await resMismatch.json();
    if (resMismatch.status !== 400) {
      throw new Error(`FAIL: Expected 400 for mismatched cohort, got ${resMismatch.status}`);
    }
    if (!jsonMismatch.message?.includes("does not belong to the selected course")) {
      throw new Error(`FAIL: Unexpected error message: ${jsonMismatch.message}`);
    }
    console.log(`[PASS] Correctly rejected cross-course cohort binding: "${jsonMismatch.message}"`);

    // ── TEST 4: DUPLICATE BATCH CODES ARE HANDLED SAFELY ──────────────────────
    console.log("\n[Test 4] Verifying duplicate custom batch code handling...");
    const customCode = `CUST-${testSuffix}`;
    const reqDup1 = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        course: courseA._id.toString(),
        cohort: cohortA._id.toString(),
        batchName: "Custom Code 1",
        batchCode: customCode,
      }),
    });
    const resDup1 = await createBatch(reqDup1);
    const jsonDup1 = await resDup1.json();
    if (resDup1.status !== 201) {
      throw new Error(`FAIL: Expected 201 for initial custom code, got ${resDup1.status}`);
    }
    cleanupIds.batches.push(new mongoose.Types.ObjectId(jsonDup1.data.id || jsonDup1.data._id));

    // Second request with duplicate code
    const reqDup2 = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        course: courseA._id.toString(),
        cohort: cohortA._id.toString(),
        batchName: "Custom Code Duplicate",
        batchCode: customCode,
      }),
    });
    const resDup2 = await createBatch(reqDup2);
    const jsonDup2 = await resDup2.json();
    if (resDup2.status !== 400) {
      throw new Error(`FAIL: Expected 400 for duplicate batch code, got ${resDup2.status}`);
    }
    console.log(`[PASS] Safely rejected duplicate batch code: "${jsonDup2.message}"`);

    // ── TEST 5: INVALID OR NON-POSITIVE CAPACITY IS REJECTED ──────────────────
    console.log("\n[Test 5] Verifying invalid or non-positive capacity rejection...");
    for (const invalidCap of [-10, 0, 15.5]) {
      const reqInvalidCap = new NextRequest("http://localhost:3000/api/batches", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          course: courseA._id.toString(),
          cohort: cohortA._id.toString(),
          batchName: "Invalid Capacity Test",
          capacity: invalidCap,
        }),
      });
      const resInvalidCap = await createBatch(reqInvalidCap);
      if (resInvalidCap.status !== 400) {
        throw new Error(`FAIL: Expected 400 for capacity ${invalidCap}, got ${resInvalidCap.status}`);
      }
    }
    console.log("[PASS] Correctly rejected negative, zero, and fractional capacities.");

    // ── TEST 6: BATCH PERSISTS AND IS RETRIEVABLE (PAGE REFRESH) ──────────────
    console.log("\n[Test 6] Verifying batch persistence and retrieval via GET...");
    const getReq = new NextRequest(`http://localhost:3000/api/batches?course=${courseA._id}&limit=100`, {
      method: "GET",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const getRes = await getBatches(getReq);
    const getJson = await getRes.json();
    if (getRes.status !== 200 || !Array.isArray(getJson.data)) {
      throw new Error(`FAIL: Expected 200 from GET /api/batches, got ${getRes.status}`);
    }
    const persisted = getJson.data.find(
      (b: any) => (b.id || b._id?.toString()) === (createdBatch1.id || createdBatch1._id?.toString())
    );
    if (!persisted) {
      throw new Error("FAIL: Created batch not found in GET response!");
    }
    console.log(`[PASS] Batch ${persisted.code || persisted.batchCode} retrieved successfully from server.`);

    // ── TEST 7: CORRECT COURSE AND COHORT APPEAR ON RESOLVED BATCH CARD ───────
    console.log("\n[Test 7] Verifying course and cohort resolution for batch card display...");
    const dbBatch = await Batch.findById(createdBatch1.id || createdBatch1._id).populate([
      "cohort",
      "course",
      "primaryTeacher",
    ]);
    const resolvedCard = AcademicResolver.resolveBatch(dbBatch);
    if (!resolvedCard.course || resolvedCard.course.name !== courseA.courseName) {
      throw new Error(`FAIL: Expected resolved course "${courseA.courseName}", got "${resolvedCard.course?.name}"`);
    }
    if (!resolvedCard.cohort || resolvedCard.cohort.name !== cohortA.cohortName) {
      throw new Error(`FAIL: Expected resolved cohort "${cohortA.cohortName}", got "${resolvedCard.cohort?.name}"`);
    }
    console.log(`[PASS] Resolved batch card: Course "${resolvedCard.course.name}", Cohort "${resolvedCard.cohort.name}"`);

    // ── TEST 8: EXISTING BATCH RECORDS REMAIN UNCHANGED ───────────────────────
    console.log("\n[Test 8] Verifying existing batch records remain unchanged...");
    const initialStrength = dbBatch.currentStrength;
    const initialCapacity = dbBatch.maxCapacity;

    // Create another batch
    const reqAnother = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        course: courseA._id.toString(),
        cohort: cohortA._id.toString(),
        batchName: `Batch 2 Beta ${testSuffix}`,
        capacity: 50,
      }),
    });
    const resAnother = await createBatch(reqAnother);
    const jsonAnother = await resAnother.json();
    cleanupIds.batches.push(new mongoose.Types.ObjectId(jsonAnother.data.id || jsonAnother.data._id));

    const checkBatch1 = await Batch.findById(createdBatch1.id || createdBatch1._id);
    if (checkBatch1.currentStrength !== initialStrength || checkBatch1.maxCapacity !== initialCapacity) {
      throw new Error("FAIL: Existing batch capacity or strength was unexpectedly altered!");
    }
    console.log("[PASS] Existing batch records remained intact.");

    // ── TEST 9: UNPAID ENROLLMENTS ARE NOT ACCIDENTALLY ALLOCATED ─────────────
    console.log("\n[Test 9] Verifying waiting-payment enrollments are not auto-allocated...");
    const studentUserUnpaid = await User.create({
      firstName: "Unpaid",
      lastName: `Student${testSuffix}`,
      email: `unpaid_stu_${testSuffix}@truelern.test`,
      password: "TestPassword123!",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"),
    });
    cleanupIds.users.push(studentUserUnpaid._id);

    const dummyParentId = new mongoose.Types.ObjectId();
    const studentUnpaid = await Student.create({
      user: studentUserUnpaid._id,
      studentId: `STU-UNP-${testSuffix}`,
      admissionNumber: `ADM-UNP-${testSuffix}`,
      registrationNumber: `REG-UNP-${testSuffix}`,
      firstName: "Unpaid",
      lastName: `Student${testSuffix}`,
      phone: "+15551234567",
      parent: dummyParentId,
      status: "pending",
    });
    cleanupIds.students.push(studentUnpaid._id);

    const unpaidEnrollment = await Enrollment.create({
      enrollmentNumber: `ENR-UNP-${testSuffix}`,
      student: studentUnpaid._id,
      course: courseA._id,
      academicSession: session._id,
      status: "waiting-payment",
      enrollmentDate: new Date(),
    });
    cleanupIds.enrollments.push(unpaidEnrollment._id);

    // Creating another batch
    const reqAfterUnpaid = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        course: courseA._id.toString(),
        cohort: cohortA._id.toString(),
        batchName: `Batch 3 Gamma ${testSuffix}`,
      }),
    });
    const resAfterUnpaid = await createBatch(reqAfterUnpaid);
    const jsonAfterUnpaid = await resAfterUnpaid.json();
    cleanupIds.batches.push(new mongoose.Types.ObjectId(jsonAfterUnpaid.data.id || jsonAfterUnpaid.data._id));

    // Verify unpaid enrollment remained waiting-payment and was not allocated
    const checkUnpaid = await Enrollment.findById(unpaidEnrollment._id);
    if (checkUnpaid.status !== "waiting-payment") {
      throw new Error(`FAIL: Unpaid enrollment status changed to ${checkUnpaid.status}!`);
    }
    const studentBatchLink = await BatchStudent.findOne({ student: studentUnpaid._id });
    if (studentBatchLink) {
      throw new Error("FAIL: Unpaid student was allocated to a batch!");
    }
    console.log("[PASS] Unpaid enrollment remained in waiting-payment without accidental allocation.");

    // ── TEST 10: EXISTING ENROLLMENT AUTOMATION WORKS FOR CONFIRMED ENROLLMENT
    console.log("\n[Test 10] Verifying confirmed enrollment allocates to available batch...");
    const studentUserPaid = await User.create({
      firstName: "Paid",
      lastName: `Student${testSuffix}`,
      email: `paid_stu_${testSuffix}@truelern.test`,
      password: "TestPassword123!",
      role: new mongoose.Types.ObjectId("6a87de6161b5b8570e7a7ed7"),
    });
    cleanupIds.users.push(studentUserPaid._id);

    const studentPaid = await Student.create({
      user: studentUserPaid._id,
      studentId: `STU-PAID-${testSuffix}`,
      admissionNumber: `ADM-PAID-${testSuffix}`,
      registrationNumber: `REG-PAID-${testSuffix}`,
      firstName: "Paid",
      lastName: `Student${testSuffix}`,
      phone: "+15551234568",
      parent: dummyParentId,
      status: "active",
    });
    cleanupIds.students.push(studentPaid._id);

    const paidEnrollment = await Enrollment.create({
      enrollmentNumber: `ENR-PAID-${testSuffix}`,
      student: studentPaid._id,
      course: courseA._id,
      academicSession: session._id,
      status: "confirmed",
      enrollmentDate: new Date(),
    });
    cleanupIds.enrollments.push(paidEnrollment._id);

    // Run EnrollmentAutomationService for confirmed enrollment
    await EnrollmentAutomationService.handleEnrollmentConfirmed(paidEnrollment._id.toString());

    const checkPaidEnrollment = await Enrollment.findById(paidEnrollment._id);
    if (checkPaidEnrollment.status !== "batch-assigned") {
      throw new Error(`FAIL: Expected status batch-assigned, got ${checkPaidEnrollment.status}`);
    }
    const paidBatchLink = await BatchStudent.findOne({ student: studentPaid._id });
    if (!paidBatchLink) {
      throw new Error("FAIL: BatchStudent record not found for confirmed enrollment!");
    }
    cleanupIds.batchStudents.push(paidBatchLink._id);
    console.log(`[PASS] Enrollment automation assigned student ${studentPaid.studentId} to batch ${paidBatchLink.batch}.`);

    // ── TEST 11: UNAUTHORIZED REQUESTS ARE REJECTED ───────────────────────────
    console.log("\n[Test 11] Verifying non-admin / unauthorized requests are rejected...");
    const reqStudent = new NextRequest("http://localhost:3000/api/batches", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        course: courseA._id.toString(),
        cohort: cohortA._id.toString(),
        batchName: "Student Unauthorized Batch",
      }),
    });
    const resStudent = await createBatch(reqStudent);
    if (resStudent.status !== 403 && resStudent.status !== 401) {
      throw new Error(`FAIL: Expected 403/401 for student, got ${resStudent.status}`);
    }
    console.log("[PASS] Correctly rejected unauthorized request (status 403/401).");

    // ── TEST 12: REPEATED SUBMISSIONS GENERATE UNIQUE CODES WITHOUT COLLISION ──
    console.log("\n[Test 12] Verifying sequential unique code generation on repeated calls...");
    const codes = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const reqSeq = new NextRequest("http://localhost:3000/api/batches", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          course: courseA._id.toString(),
          cohort: cohortA._id.toString(),
          batchName: `Sequential Batch ${i} ${testSuffix}`,
        }),
      });
      const resSeq = await createBatch(reqSeq);
      const jsonSeq = await resSeq.json();
      if (resSeq.status !== 201) {
        throw new Error(`FAIL: Sequential creation failed: ${JSON.stringify(jsonSeq)}`);
      }
      cleanupIds.batches.push(new mongoose.Types.ObjectId(jsonSeq.data.id || jsonSeq.data._id));
      const code = jsonSeq.data.batchCode;
      if (codes.has(code)) {
        throw new Error(`FAIL: Collision detected! Code ${code} was generated multiple times.`);
      }
      codes.add(code);
    }
    console.log(`[PASS] Repeated calls generated unique collision-free codes: ${Array.from(codes).join(", ")}`);

    console.log("\n=======================================================");
    console.log("ALL 12 BATCH CREATION TESTS PASSED PERFECTLY!");
    console.log("=======================================================\n");

  } finally {
    console.log("[Teardown] Cleaning up disposable fixtures...");
    for (const id of cleanupIds.batchStudents) await BatchStudent.deleteOne({ _id: id });
    for (const id of cleanupIds.batchTeachers) await BatchTeacher.deleteOne({ _id: id });
    for (const id of cleanupIds.batches) await Batch.deleteOne({ _id: id });
    for (const id of cleanupIds.enrollments) await Enrollment.deleteOne({ _id: id });
    for (const id of cleanupIds.students) await Student.deleteOne({ _id: id });
    for (const id of cleanupIds.cohorts) await Cohort.deleteOne({ _id: id });
    for (const id of cleanupIds.academicSessions) await AcademicSession.deleteOne({ _id: id });
    for (const id of cleanupIds.teachers) await Teacher.deleteOne({ _id: id });
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
