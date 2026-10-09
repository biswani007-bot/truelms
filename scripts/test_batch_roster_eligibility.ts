import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/user.model";
import { Student } from "../models/student.model";
import { Teacher } from "../models/teacher.model";
import { Course } from "../models/course.model";
import { Cohort } from "../models/cohort.model";
import { AcademicSession } from "../models/academic-session.model";
import { Batch } from "../models/batch.model";
import { BatchStudent } from "../models/batch-student.model";
import { Enrollment } from "../models/enrollment.model";
import { JwtHelper } from "../helpers/jwt";
import { RosterEligibilityService } from "../services/batch/roster-eligibility.service";
import { AssignmentService } from "../services/batch/assignment.service";
import { EnrollmentAutomationService } from "../services/automation/enrollment-automation.service";
import { GET as getStudentsHandler, POST as assignStudentHandler } from "../app/api/batches/[id]/students/route";
import { GET as getEligibleHandler } from "../app/api/batches/[id]/students/eligible/route";
import { NextRequest } from "next/server";

async function runTestSuite() {
  console.log("=== TrueLern Batch Roster & Course Enrollment Eligibility Test Suite ===\n");
  const startTime = Date.now();
  await connectDB();
  console.log(`[INIT] Connected to MongoDB in ${Date.now() - startTime}ms`);

  const testSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  const cleanupIds: {
    users: mongoose.Types.ObjectId[];
    students: mongoose.Types.ObjectId[];
    courses: mongoose.Types.ObjectId[];
    cohorts: mongoose.Types.ObjectId[];
    academicSessions: mongoose.Types.ObjectId[];
    batches: mongoose.Types.ObjectId[];
    batchStudents: mongoose.Types.ObjectId[];
    enrollments: mongoose.Types.ObjectId[];
  } = {
    users: [],
    students: [],
    courses: [],
    cohorts: [],
    academicSessions: [],
    batches: [],
    batchStudents: [],
    enrollments: [],
  };

  try {
    // Setup Admin and Student tokens
    const adminUser = await User.create({
      firstName: `Admin`,
      lastName: `Roster${testSuffix}`,
      email: `admin.roster.${testSuffix}@truelern.test`,
      password: "HashedPassword123!",
      role: new mongoose.Types.ObjectId(),
    });
    cleanupIds.users.push(adminUser._id);

    const adminToken = JwtHelper.signAccess({
      userId: adminUser._id.toString(),
      role: "Admin",
    });

    const unauthorizedToken = JwtHelper.signAccess({
      userId: new mongoose.Types.ObjectId().toString(),
      role: "Student",
    });

    // Setup Academic Session
    let session = await AcademicSession.findOne({ status: "active" });
    if (!session) {
      session = await AcademicSession.create({
        sessionCode: `SESS-${testSuffix}`,
        sessionName: `Session ${testSuffix}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: "active",
      });
      cleanupIds.academicSessions.push(session._id);
    }

    // Create Junior Foundation Course & Another Course (Future-Ready Builders)
    const juniorCourse = await Course.create({
      courseCode: `JF-${testSuffix}`,
      courseName: `Junior Foundation ${testSuffix}`,
      slug: `junior-foundation-${testSuffix}`,
      category: new mongoose.Types.ObjectId(),
      shortDescription: "Junior Foundation curriculum",
      longDescription: "Junior Foundation comprehensive STEM curriculum",
      duration: 12,
      durationUnit: "weeks",
      level: "beginner",
      difficulty: "easy",
      deliveryMode: "live-cohort",
      certificateAvailable: true,
      featured: true,
      version: "1.0",
      requirements: {},
      pricing: { type: "one-time", price: 500, currency: "USD", taxPercentage: 10 },
      status: "published",
      isDeleted: false,
    });
    cleanupIds.courses.push(juniorCourse._id);

    const otherCourse = await Course.create({
      courseCode: `FRB-${testSuffix}`,
      courseName: `Future-Ready Builders ${testSuffix}`,
      slug: `future-ready-builders-${testSuffix}`,
      category: new mongoose.Types.ObjectId(),
      shortDescription: "Future-Ready Builders curriculum",
      longDescription: "Future-Ready Builders comprehensive robotics and coding",
      duration: 12,
      durationUnit: "weeks",
      level: "intermediate",
      difficulty: "medium",
      deliveryMode: "live-cohort",
      certificateAvailable: true,
      featured: true,
      version: "1.0",
      requirements: {},
      pricing: { type: "one-time", price: 600, currency: "USD", taxPercentage: 10 },
      status: "published",
      isDeleted: false,
    });
    cleanupIds.courses.push(otherCourse._id);

    // Setup Teacher
    let teacher = await Teacher.findOne({ status: "active" });
    if (!teacher) {
      const teacherUser = await User.create({
        firstName: "Teacher",
        lastName: `Test${testSuffix}`,
        email: `teacher.${testSuffix}@truelern.test`,
        password: "HashedPassword123!",
        role: new mongoose.Types.ObjectId(),
      });
      cleanupIds.users.push(teacherUser._id);
      teacher = await Teacher.create({
        user: teacherUser._id,
        employeeId: `EMP-${testSuffix}`,
        teacherCode: `TCH-${testSuffix}`,
        firstName: "Teacher",
        lastName: `Test${testSuffix}`,
        status: "active",
        gender: "male",
        dob: new Date("1990-01-01"),
        phone: "+15551234567",
        address: "123 Main St",
        city: "City",
        state: "State",
        country: "USA",
        postalCode: "12345",
        nationality: "American",
        designation: "Instructor",
        department: "Academics",
        joiningDate: new Date(),
        employmentType: "full-time",
        experienceYears: 5,
        qualifications: ["B.S."],
        skills: ["Teaching"],
        languages: ["en"],
        isCounsellor: false,
      });
    }

    // Create Cohort for Junior Foundation
    const cohort = await Cohort.create({
      cohortCode: `COH-JF-${testSuffix}`,
      cohortName: `Junior Foundation Cohort ${testSuffix}`,
      course: juniorCourse._id,
      academicSession: session._id,
      primaryInstructor: teacher._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      enrollmentStart: new Date(),
      enrollmentEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxCapacity: 30,
      minCapacity: 2,
      currentEnrollment: 0,
      deliveryMode: "live-online",
      certificateEligible: true,
      status: "running",
    });
    cleanupIds.cohorts.push(cohort._id);

    // Create Batch for Junior Foundation
    const batch = await Batch.create({
      batchCode: `BAT-JF-${testSuffix}`,
      batchName: `Junior Foundation Batch ${testSuffix}`,
      cohort: cohort._id,
      course: juniorCourse._id,
      language: "en",
      timezone: "UTC",
      defaultCapacity: 2,
      maxCapacity: 2,
      minCapacity: 1,
      currentStrength: 0,
      availableSeats: 2,
      reservedSeats: 0,
      waitingCount: 0,
      batchStart: new Date(),
      batchEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "open",
      isDeleted: false,
    });
    cleanupIds.batches.push(batch._id);

    // Helper to create test student with enrollment
    const createTestStudent = async (
      name: string,
      courseId: mongoose.Types.ObjectId,
      enrollmentStatus: "waiting-payment" | "confirmed" | "batch-assigned" | "cancelled"
    ) => {
      const u = await User.create({
        firstName: name,
        lastName: `Test${testSuffix}`,
        email: `${name.toLowerCase()}.${testSuffix}@student.test`,
        password: "HashedPassword123!",
        role: new mongoose.Types.ObjectId(),
      });
      cleanupIds.users.push(u._id);

      const s = await Student.create({
        studentId: `STU-${name.toUpperCase()}-${testSuffix}`,
        admissionNumber: `ADM-${name.toUpperCase()}-${testSuffix}`,
        registrationNumber: `REG-${name.toUpperCase()}-${testSuffix}`,
        firstName: name,
        lastName: `Test${testSuffix}`,
        user: u._id,
        email: u.email,
        phone: "+15551234567",
        status: "active",
      });
      cleanupIds.students.push(s._id);

      const enr = await Enrollment.create({
        enrollmentNumber: `ENR-${name.toUpperCase()}-${testSuffix}`,
        student: s._id,
        course: courseId,
        enrollmentDate: new Date(),
        academicSession: session?.sessionCode || `SESS-${testSuffix}`,
        status: enrollmentStatus,
        isDeleted: false,
      });
      cleanupIds.enrollments.push(enr._id);

      return { user: u, student: s, enrollment: enr };
    };

    // Candidate 1: Junior Foundation, Confirmed / Paid
    const student1 = await createTestStudent("Alice", juniorCourse._id, "confirmed");

    // Candidate 2: Junior Foundation, Confirmed / Paid
    const student2 = await createTestStudent("Bob", juniorCourse._id, "confirmed");

    // Candidate 3: Other Course (Future-Ready Builders), Confirmed / Paid
    const studentOtherCourse = await createTestStudent("Charlie", otherCourse._id, "confirmed");

    // Candidate 4: Junior Foundation, Unpaid ("waiting-payment")
    const studentUnpaid = await createTestStudent("David", juniorCourse._id, "waiting-payment");

    // Candidate 5: Junior Foundation, Cancelled
    const studentCancelled = await createTestStudent("Eve", juniorCourse._id, "cancelled");

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 1: Junior Foundation batch displays eligible Junior Foundation students");
    console.log("--------------------------------------------------------------------------------");
    {
      const req = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students?eligible=true`,
        { headers: { authorization: `Bearer ${adminToken}` } }
      );
      const res = await getStudentsHandler(req, { params: Promise.resolve({ id: batch._id.toString() }) });
      const body = await res.json();

      if (!body.success) throw new Error(`GET eligible failed: ${JSON.stringify(body)}`);
      const eligible = body.data as any[];

      const alicePresent = eligible.some((e) => e.studentId === student1.student._id.toString());
      const bobPresent = eligible.some((e) => e.studentId === student2.student._id.toString());

      if (!alicePresent || !bobPresent) {
        throw new Error(`Alice and Bob should be eligible. Got: ${JSON.stringify(eligible.map((e) => e.name))}`);
      }
      console.log(`[PASS] Eligible Junior Foundation students displayed automatically: ${eligible.length} students found.`);
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 2: A student enrolled in a different course is not shown");
    console.log("--------------------------------------------------------------------------------");
    {
      const req = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students/eligible`,
        { headers: { authorization: `Bearer ${adminToken}` } }
      );
      const res = await getEligibleHandler(req, { params: Promise.resolve({ id: batch._id.toString() }) });
      const body = await res.json();
      const eligible = body.data as any[];

      const charliePresent = eligible.some((e) => e.studentId === studentOtherCourse.student._id.toString());
      if (charliePresent) {
        throw new Error("Charlie (enrolled in Future-Ready Builders) was incorrectly displayed in Junior Foundation batch!");
      }
      console.log("[PASS] Student enrolled in different course is strictly excluded.");
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 3: A valid confirmed enrollment can be assigned according to existing rules");
    console.log("--------------------------------------------------------------------------------");
    {
      const req = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            studentId: student1.student._id.toString(),
            enrollmentId: student1.enrollment._id.toString(),
          }),
        }
      );
      const res = await assignStudentHandler(req, { params: Promise.resolve({ id: batch._id.toString() }) });
      const body = await res.json();

      if (!body.success || res.status !== 201) {
        throw new Error(`Failed to assign Alice: ${JSON.stringify(body)}`);
      }

      const assignment = await BatchStudent.findOne({
        batch: batch._id,
        student: student1.student._id,
        status: "active",
      });
      if (!assignment) throw new Error("BatchStudent record was not created!");
      cleanupIds.batchStudents.push(assignment._id);

      const refreshedEnr = await Enrollment.findById(student1.enrollment._id);
      if (refreshedEnr?.status !== "batch-assigned") {
        throw new Error(`Enrollment status should be 'batch-assigned', got ${refreshedEnr?.status}`);
      }

      console.log(`[PASS] Alice successfully assigned to batch and enrollment transitioned to 'batch-assigned'.`);
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 4: An unpaid enrollment is not incorrectly allocated");
    console.log("--------------------------------------------------------------------------------");
    {
      // 1. Verify David (unpaid) is not returned by eligibility query
      const eligRes = await RosterEligibilityService.getEligibleStudentsForBatch(batch._id.toString());
      const davidEligible = eligRes?.eligibleStudents.some(
        (s) => s.studentId === studentUnpaid.student._id.toString()
      );
      if (davidEligible) {
        throw new Error("Unpaid student David was incorrectly marked as eligible!");
      }

      // 2. Verify POST endpoint rejects assigning David with 400
      const req = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            studentId: studentUnpaid.student._id.toString(),
            enrollmentId: studentUnpaid.enrollment._id.toString(),
          }),
        }
      );
      const res = await assignStudentHandler(req, { params: Promise.resolve({ id: batch._id.toString() }) });
      const body = await res.json();

      if (res.status !== 400 || body.success) {
        throw new Error(`Unpaid student allocation should have returned 400! Got ${res.status}: ${JSON.stringify(body)}`);
      }
      console.log(`[PASS] Unpaid student allocation was correctly rejected: ${body.error || body.message}`);
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 5: Already assigned students are excluded");
    console.log("--------------------------------------------------------------------------------");
    {
      const eligRes = await RosterEligibilityService.getEligibleStudentsForBatch(batch._id.toString());
      const aliceStillEligible = eligRes?.eligibleStudents.some(
        (s) => s.studentId === student1.student._id.toString()
      );
      if (aliceStillEligible) {
        throw new Error("Alice is already assigned to this batch, but was returned in eligible candidates list!");
      }

      // Verify POST rejects duplicate assignment
      const req = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            studentId: student1.student._id.toString(),
            enrollmentId: student1.enrollment._id.toString(),
          }),
        }
      );
      const res = await assignStudentHandler(req, { params: Promise.resolve({ id: batch._id.toString() }) });
      const body = await res.json();

      if (res.status !== 400 || body.success) {
        throw new Error(`Duplicate assignment should have returned 400! Got ${res.status}`);
      }
      console.log(`[PASS] Already assigned student Alice excluded from eligible list and duplicate assignment rejected.`);
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 6: Batch capacity is enforced");
    console.log("--------------------------------------------------------------------------------");
    {
      // Current batch maxCapacity is 2. Alice is seat 1. Now assign Bob for seat 2.
      const req2 = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            studentId: student2.student._id.toString(),
            enrollmentId: student2.enrollment._id.toString(),
          }),
        }
      );
      const res2 = await assignStudentHandler(req2, { params: Promise.resolve({ id: batch._id.toString() }) });
      const body2 = await res2.json();
      if (!body2.success) throw new Error(`Failed to assign Bob: ${JSON.stringify(body2)}`);

      const assignment2 = await BatchStudent.findOne({
        batch: batch._id,
        student: student2.student._id,
        status: "active",
      });
      if (assignment2) cleanupIds.batchStudents.push(assignment2._id);

      // Now batch has 2 students and maxCapacity = 2.
      // Create student 6 (Frank) with confirmed enrollment
      const student6 = await createTestStudent("Frank", juniorCourse._id, "confirmed");

      // Attempt to assign Frank to the full batch
      const req3 = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            studentId: student6.student._id.toString(),
            enrollmentId: student6.enrollment._id.toString(),
          }),
        }
      );
      const res3 = await assignStudentHandler(req3, { params: Promise.resolve({ id: batch._id.toString() }) });
      const body3 = await res3.json();

      if (res3.status !== 400 || body3.success) {
        throw new Error(`Full batch assignment should be rejected or handled. Status: ${res3.status}, Body: ${JSON.stringify(body3)}`);
      }
      console.log(`[PASS] Batch capacity correctly enforced (2/2 seats occupied). Assignment rejected: ${body3.error || body3.message}`);
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 7: Search filters eligible students without exposing other courses");
    console.log("--------------------------------------------------------------------------------");
    {
      // Create a batch with higher capacity to test searching
      const searchBatch = await Batch.create({
        batchCode: `BAT-SEARCH-${testSuffix}`,
        batchName: `Search Batch ${testSuffix}`,
        cohort: cohort._id,
        course: juniorCourse._id,
        language: "en",
        timezone: "UTC",
        defaultCapacity: 50,
        maxCapacity: 50,
        currentStrength: 0,
        availableSeats: 50,
        batchStart: new Date(),
        batchEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "open",
        isDeleted: false,
      });
      cleanupIds.batches.push(searchBatch._id);

      // Candidate Grace in Junior Foundation
      const grace = await createTestStudent("GraceUniqueName", juniorCourse._id, "confirmed");

      // Search for Grace by partial name
      const reqGrace = new NextRequest(
        `http://localhost:3000/api/batches/${searchBatch._id}/students?eligible=true&search=GraceUnique`,
        { headers: { authorization: `Bearer ${adminToken}` } }
      );
      const resGrace = await getStudentsHandler(reqGrace, { params: Promise.resolve({ id: searchBatch._id.toString() }) });
      const bodyGrace = await resGrace.json();
      const resultsGrace = bodyGrace.data as any[];

      if (resultsGrace.length !== 1 || resultsGrace[0].studentId !== grace.student._id.toString()) {
        throw new Error(`Search for Grace failed: ${JSON.stringify(resultsGrace)}`);
      }

      // Search for Charlie (who is enrolled in Future-Ready Builders)
      const reqCharlie = new NextRequest(
        `http://localhost:3000/api/batches/${searchBatch._id}/students?eligible=true&search=Charlie`,
        { headers: { authorization: `Bearer ${adminToken}` } }
      );
      const resCharlie = await getStudentsHandler(reqCharlie, { params: Promise.resolve({ id: searchBatch._id.toString() }) });
      const bodyCharlie = await resCharlie.json();
      const resultsCharlie = bodyCharlie.data as any[];

      if (resultsCharlie.length !== 0) {
        throw new Error(`Search leaked student from another course: ${JSON.stringify(resultsCharlie)}`);
      }
      console.log(`[PASS] Search returned Grace (${resultsGrace.length}) and strictly returned 0 for other-course students.`);
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 8: Adding a student persists after refresh");
    console.log("--------------------------------------------------------------------------------");
    {
      const reqRoster = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students`,
        { headers: { authorization: `Bearer ${adminToken}` } }
      );
      const resRoster = await getStudentsHandler(reqRoster, { params: Promise.resolve({ id: batch._id.toString() }) });
      const bodyRoster = await resRoster.json();

      const activeRoster = bodyRoster.data as any[];
      const aliceInRoster = activeRoster.some((s) => (s.student?._id || s.student).toString() === student1.student._id.toString());
      const bobInRoster = activeRoster.some((s) => (s.student?._id || s.student).toString() === student2.student._id.toString());

      if (!aliceInRoster || !bobInRoster) {
        throw new Error(`Roster missing persisted students: ${JSON.stringify(activeRoster)}`);
      }
      console.log(`[PASS] Batch roster contains ${activeRoster.length} persisted active students.`);
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 9: Unauthorized requests are rejected");
    console.log("--------------------------------------------------------------------------------");
    {
      const unauthReq = new NextRequest(
        `http://localhost:3000/api/batches/${batch._id}/students?eligible=true`,
        { headers: { authorization: `Bearer ${unauthorizedToken}` } }
      );
      const unauthRes = await getStudentsHandler(unauthReq, { params: Promise.resolve({ id: batch._id.toString() }) });

      if (unauthRes.status !== 403 && unauthRes.status !== 401) {
        throw new Error(`Unauthorized request should be 401 or 403, got ${unauthRes.status}`);
      }
      console.log(`[PASS] Unauthorized request rejected with HTTP ${unauthRes.status}.`);
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 10: Existing enrollment and batch allocation automation still works");
    console.log("--------------------------------------------------------------------------------");
    {
      // Create fresh automation student and batch
      const autoBatch = await Batch.create({
        batchCode: `BAT-AUTO-${testSuffix}`,
        batchName: `Auto Batch ${testSuffix}`,
        cohort: cohort._id,
        course: juniorCourse._id,
        language: "en",
        timezone: "UTC",
        defaultCapacity: 10,
        maxCapacity: 10,
        currentStrength: 0,
        availableSeats: 10,
        batchStart: new Date(),
        batchEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "open",
        isDeleted: false,
      });
      cleanupIds.batches.push(autoBatch._id);

      const autoStudent = await createTestStudent("HannahAuto", juniorCourse._id, "confirmed");

      // Trigger existing EnrollmentAutomationService
      const automationResult = await EnrollmentAutomationService.handleEnrollmentConfirmed(
        autoStudent.enrollment._id.toString()
      );

      if (!automationResult || automationResult.skipped) {
        throw new Error(`EnrollmentAutomation failed or skipped: ${JSON.stringify(automationResult)}`);
      }

      const assignedBatchStudent = await BatchStudent.findOne({
        student: autoStudent.student._id,
        status: "active",
      });

      if (!assignedBatchStudent) {
        throw new Error("EnrollmentAutomationService did not assign student to available batch!");
      }
      cleanupIds.batchStudents.push(assignedBatchStudent._id);

      console.log(`[PASS] EnrollmentAutomationService successfully assigned automated student to batch.`);
    }

    console.log("\n================================================================================");
    console.log("ALL 10 TESTS PASSED SUCCESSFULLY! Batch roster eligibility verified.");
    console.log("================================================================================\n");

  } finally {
    console.log("[CLEANUP] Cleaning up test records...");
    await BatchStudent.deleteMany({ _id: { $in: cleanupIds.batchStudents } });
    await Batch.deleteMany({ _id: { $in: cleanupIds.batches } });
    await Enrollment.deleteMany({ _id: { $in: cleanupIds.enrollments } });
    await Student.deleteMany({ _id: { $in: cleanupIds.students } });
    await User.deleteMany({ _id: { $in: cleanupIds.users } });
    await Cohort.deleteMany({ _id: { $in: cleanupIds.cohorts } });
    await Course.deleteMany({ _id: { $in: cleanupIds.courses } });
    await AcademicSession.deleteMany({ _id: { $in: cleanupIds.academicSessions } });
    console.log("[CLEANUP] Done.");
    await mongoose.disconnect();
  }
}

runTestSuite().catch((err) => {
  console.error("\n[TEST SUITE FAILURE]:", err);
  process.exit(1);
});
