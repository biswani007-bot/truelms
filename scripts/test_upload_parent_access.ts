import "dotenv/config";
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { GET } from "../app/uploads/[filename]/route";
import { JwtHelper } from "../helpers/jwt";

import { User } from "../models/user.model";
import { Role } from "../models/role.model";
import { Parent } from "../models/parent.model";
import { Student } from "../models/student.model";
import { ParentStudentLink } from "../models/parent-student-link.model";
import { Assignment } from "../models/assignment.model";
import { AssignmentAttachment } from "../models/assignment-attachment.model";
import { AssignmentSubmission } from "../models/assignment-submission.model";
import { Batch } from "../models/batch.model";
import { Enrollment } from "../models/enrollment.model";

const MONGODB_URI = process.env.MONGODB_URI || "";

function createReq(url: string, token?: string, cookieToken?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }
  if (cookieToken) {
    headers["cookie"] = `accessToken=${cookieToken}`;
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    headers,
  });
}

async function runTests() {
  console.log("=== Comprehensive Upload Route Parent Access Security Tests ===");

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable not configured");
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  console.log("[PASS] Connected to MongoDB");

  const cleanupIds: {
    users: any[];
    parents: any[];
    students: any[];
    links: any[];
    batches: any[];
    enrollments: any[];
    assignments: any[];
    attachments: any[];
    submissions: any[];
    files: string[];
  } = {
    users: [],
    parents: [],
    students: [],
    links: [],
    batches: [],
    enrollments: [],
    assignments: [],
    attachments: [],
    submissions: [],
    files: [],
  };

  try {
    const uploadDir = path.join(process.cwd(), "storage", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const createDummyFile = async (name: string, content = "test content") => {
      const p = path.join(uploadDir, name);
      await fs.writeFile(p, content, "utf8");
      cleanupIds.files.push(p);
    };

    const ts = Date.now();
    const fnPublic = `test-pub-${ts}.pdf`;
    const fnEnrolled = `test-enr-${ts}.pdf`;
    const fnNotEnrolled = `test-notenr-${ts}.pdf`;
    const fnChildSub = `test-childsub-${ts}.pdf`;
    const fnOtherSub = `test-othersub-${ts}.pdf`;
    const fnArbitrary = `test-arbitrary-${ts}.pdf`;

    await createDummyFile(fnPublic);
    await createDummyFile(fnEnrolled);
    await createDummyFile(fnNotEnrolled);
    await createDummyFile(fnChildSub);
    await createDummyFile(fnOtherSub);
    await createDummyFile(fnArbitrary);

    // Resolve or create Roles
    let parentRole = await Role.findOne({ name: { $regex: /^parent$/i } });
    if (!parentRole) {
      parentRole = await Role.create({ name: `Parent_${ts}`, description: "Parent role" });
      cleanupIds.users.push(parentRole._id);
    }
    let studentRole = await Role.findOne({ name: { $regex: /^student$/i } });
    if (!studentRole) {
      studentRole = await Role.create({ name: `Student_${ts}`, description: "Student role" });
      cleanupIds.users.push(studentRole._id);
    }

    // 1. Setup Parent Users
    const userParentA = await User.create({
      firstName: "TestParent",
      lastName: "Active",
      email: `testparent.active.${ts}@example.com`,
      passwordHash: "dummyhash",
      role: parentRole._id,
      status: "active",
    });
    cleanupIds.users.push(userParentA._id);

    const parentA = await Parent.create({
      user: userParentA._id,
      parentId: `PAR-A-${ts}`,
      firstName: "TestParent",
      lastName: "Active",
      email: userParentA.email,
      phone: "+1234567890",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10001",
      status: "active",
    });
    cleanupIds.parents.push(parentA._id);

    const userParentB = await User.create({
      firstName: "TestParent",
      lastName: "Disabled",
      email: `testparent.disabled.${ts}@example.com`,
      passwordHash: "dummyhash",
      role: parentRole._id,
      status: "active",
    });
    cleanupIds.users.push(userParentB._id);

    const parentB = await Parent.create({
      user: userParentB._id,
      parentId: `PAR-B-${ts}`,
      firstName: "TestParent",
      lastName: "Disabled",
      email: userParentB.email,
      phone: "+1234567891",
      address: "456 Elm St",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10001",
      status: "active",
    });
    cleanupIds.parents.push(parentB._id);

    // 2. Setup Students
    const userStudent1 = await User.create({
      firstName: "Child",
      lastName: "One",
      email: `child.one.${ts}@example.com`,
      passwordHash: "dummyhash",
      role: studentRole._id,
      status: "active",
    });
    cleanupIds.users.push(userStudent1._id);

    const student1 = await Student.create({
      user: userStudent1._id,
      studentId: `STU-TEST-${ts}-1`,
      admissionNumber: `ADM-${ts}-1`,
      registrationNumber: `REG-${ts}-1`,
      firstName: "Child",
      lastName: "One",
      email: userStudent1.email,
      phone: "+1234567890",
      dob: new Date("2010-01-01"),
      status: "active",
    });
    cleanupIds.students.push(student1._id);

    const userStudent2 = await User.create({
      firstName: "Child",
      lastName: "Two",
      email: `child.two.${ts}@example.com`,
      passwordHash: "dummyhash",
      role: studentRole._id,
      status: "active",
    });
    cleanupIds.users.push(userStudent2._id);

    const student2 = await Student.create({
      user: userStudent2._id,
      studentId: `STU-TEST-${ts}-2`,
      admissionNumber: `ADM-${ts}-2`,
      registrationNumber: `REG-${ts}-2`,
      firstName: "Child",
      lastName: "Two",
      email: userStudent2.email,
      phone: "+1234567892",
      dob: new Date("2010-01-01"),
      status: "active",
    });
    cleanupIds.students.push(student2._id);

    // 3. Setup ParentStudentLinks
    // Parent A -> Student 1: portal access TRUE
    const linkA = await ParentStudentLink.create({
      parent: parentA._id,
      student: student1._id,
      relationship: "Father",
      canAccessPortal: true,
      isEmergencyContact: true,
    });
    cleanupIds.links.push(linkA._id);

    // Parent B -> Student 1: portal access FALSE
    const linkB = await ParentStudentLink.create({
      parent: parentB._id,
      student: student1._id,
      relationship: "Mother",
      canAccessPortal: false,
      isEmergencyContact: false,
    });
    cleanupIds.links.push(linkB._id);

    // 4. Setup Batches
    const dummyCourseId = new mongoose.Types.ObjectId();
    const dummyCohortId = new mongoose.Types.ObjectId();
    const dummyTeacherId = new mongoose.Types.ObjectId();

    const batchEnrolled = await Batch.create({
      batchCode: `BATCH-ENR-${ts}`,
      batchName: `Batch Enrolled ${ts}`,
      cohort: dummyCohortId,
      course: dummyCourseId,
      batchStart: new Date(),
      batchEnd: new Date(Date.now() + 86400000),
      status: "active",
    });
    cleanupIds.batches.push(batchEnrolled._id);

    const batchUnenrolled = await Batch.create({
      batchCode: `BATCH-UNENR-${ts}`,
      batchName: `Batch Unenrolled ${ts}`,
      cohort: dummyCohortId,
      course: dummyCourseId,
      batchStart: new Date(),
      batchEnd: new Date(Date.now() + 86400000),
      status: "active",
    });
    cleanupIds.batches.push(batchUnenrolled._id);

    // 5. Enrollment: Student 1 in batchEnrolled
    const enrollment = await Enrollment.create({
      student: student1._id,
      batch: batchEnrolled._id,
      status: "active",
    });
    cleanupIds.enrollments.push(enrollment._id);

    // 6. Setup Assignments
    const asgnPublic = await Assignment.create({
      assignmentCode: `ASGN-PUB-${ts}`,
      title: "Public Assignment",
      description: "Public assignment description",
      course: dummyCourseId,
      cohort: dummyCohortId,
      batch: batchEnrolled._id,
      teacher: dummyTeacherId,
      type: "homework",
      releaseDate: new Date(),
      dueDate: new Date(Date.now() + 86400000),
      visibility: "public",
      status: "published",
    });
    cleanupIds.assignments.push(asgnPublic._id);

    const attPublic = await AssignmentAttachment.create({
      assignment: asgnPublic._id,
      fileName: fnPublic,
      fileUrl: `/uploads/${fnPublic}`,
      fileType: "application/pdf",
    });
    cleanupIds.attachments.push(attPublic._id);

    const asgnEnrolled = await Assignment.create({
      assignmentCode: `ASGN-ENR-${ts}`,
      title: "Enrolled Assignment",
      description: "Restricted assignment for enrolled batch",
      course: dummyCourseId,
      cohort: dummyCohortId,
      batch: batchEnrolled._id,
      teacher: dummyTeacherId,
      type: "homework",
      releaseDate: new Date(),
      dueDate: new Date(Date.now() + 86400000),
      visibility: "restricted",
      status: "published",
    });
    cleanupIds.assignments.push(asgnEnrolled._id);

    const attEnrolled = await AssignmentAttachment.create({
      assignment: asgnEnrolled._id,
      fileName: fnEnrolled,
      fileUrl: `/uploads/${fnEnrolled}`,
      fileType: "application/pdf",
    });
    cleanupIds.attachments.push(attEnrolled._id);

    const asgnNotEnrolled = await Assignment.create({
      assignmentCode: `ASGN-UNENR-${ts}`,
      title: "Not Enrolled Assignment",
      description: "Restricted assignment for unenrolled batch",
      course: dummyCourseId,
      cohort: dummyCohortId,
      batch: batchUnenrolled._id,
      teacher: dummyTeacherId,
      type: "homework",
      releaseDate: new Date(),
      dueDate: new Date(Date.now() + 86400000),
      visibility: "restricted",
      status: "published",
    });
    cleanupIds.assignments.push(asgnNotEnrolled._id);

    const attNotEnrolled = await AssignmentAttachment.create({
      assignment: asgnNotEnrolled._id,
      fileName: fnNotEnrolled,
      fileUrl: `/uploads/${fnNotEnrolled}`,
      fileType: "application/pdf",
    });
    cleanupIds.attachments.push(attNotEnrolled._id);

    // 7. Setup Submissions
    const subChild1 = await AssignmentSubmission.create({
      assignment: asgnEnrolled._id,
      student: student1._id,
      submissionNumber: `SUB-1-${ts}`,
      files: [`/uploads/${fnChildSub}`],
      status: "submitted",
    });
    cleanupIds.submissions.push(subChild1._id);

    const subChild2 = await AssignmentSubmission.create({
      assignment: asgnNotEnrolled._id,
      student: student2._id,
      submissionNumber: `SUB-2-${ts}`,
      files: [`/uploads/${fnOtherSub}`],
      status: "submitted",
    });
    cleanupIds.submissions.push(subChild2._id);

    // 8. Generate JWTs
    const tokenParentA = JwtHelper.signAccess({ userId: userParentA._id.toString(), role: "Parent" });
    const tokenParentB = JwtHelper.signAccess({ userId: userParentB._id.toString(), role: "Parent" });
    const tokenAdmin = JwtHelper.signAccess({ userId: new mongoose.Types.ObjectId().toString(), role: "Admin" });

    let testsPassed = 0;
    let testsTotal = 0;

    const assert = (condition: boolean, desc: string) => {
      testsTotal++;
      if (condition) {
        console.log(`[PASS] ${desc}`);
        testsPassed++;
      } else {
        console.error(`[FAIL] ${desc}`);
      }
    };

    // Test 1: Directory Traversal Check
    console.log("\n--- Test 1: Directory Traversal ---");
    const resTrav1 = await GET(createReq("http://localhost:3000/uploads/..%2Fsecret.txt"), {
      params: Promise.resolve({ filename: "../secret.txt" }),
    });
    assert(resTrav1.status === 400, "Directory traversal with '..' rejected with 400");

    const resTrav2 = await GET(createReq("http://localhost:3000/uploads/sub%2Ffile.txt"), {
      params: Promise.resolve({ filename: "sub/file.txt" }),
    });
    assert(resTrav2.status === 400, "Directory traversal with '/' rejected with 400");

    // Test 2: Unauthenticated Request
    console.log("\n--- Test 2: Unauthenticated Request ---");
    const resUnauth = await GET(createReq(`http://localhost:3000/uploads/${fnPublic}`), {
      params: Promise.resolve({ filename: fnPublic }),
    });
    assert(resUnauth.status === 401, "Unauthenticated request rejected with 401");

    // Test 3: Parent with canAccessPortal: false
    console.log("\n--- Test 3: Parent without Portal Access ---");
    const resNoPortal = await GET(createReq(`http://localhost:3000/uploads/${fnPublic}`, tokenParentB), {
      params: Promise.resolve({ filename: fnPublic }),
    });
    assert(resNoPortal.status === 403, "Parent with canAccessPortal: false rejected with 403");

    // Test 4: Parent accessing Public Assignment Attachment
    console.log("\n--- Test 4: Parent accessing Public Assignment Attachment ---");
    const resPub = await GET(createReq(`http://localhost:3000/uploads/${fnPublic}`, tokenParentA), {
      params: Promise.resolve({ filename: fnPublic }),
    });
    assert(resPub.status === 200, "Parent with portal access allowed public attachment (200)");
    assert(resPub.headers.get("x-content-type-options") === "nosniff", "Response contains nosniff header");
    assert(resPub.headers.get("x-frame-options") === "SAMEORIGIN", "Response contains SAMEORIGIN header");

    // Test 5: Parent accessing Enrolled Child Assignment Attachment
    console.log("\n--- Test 5: Parent accessing Enrolled Assignment Attachment ---");
    const resEnr = await GET(createReq(`http://localhost:3000/uploads/${fnEnrolled}`, tokenParentA), {
      params: Promise.resolve({ filename: fnEnrolled }),
    });
    assert(resEnr.status === 200, "Parent allowed enrolled assignment attachment (200)");

    // Test 6: Parent accessing Unenrolled Assignment Attachment
    console.log("\n--- Test 6: Parent accessing Unenrolled Assignment Attachment ---");
    const resNotEnr = await GET(createReq(`http://localhost:3000/uploads/${fnNotEnrolled}`, tokenParentA), {
      params: Promise.resolve({ filename: fnNotEnrolled }),
    });
    assert(resNotEnr.status === 403, "Parent forbidden from unenrolled assignment attachment (403)");

    // Test 7: Parent accessing Linked Child Submission
    console.log("\n--- Test 7: Parent accessing Linked Child Submission ---");
    const resChildSub = await GET(createReq(`http://localhost:3000/uploads/${fnChildSub}`, tokenParentA), {
      params: Promise.resolve({ filename: fnChildSub }),
    });
    assert(resChildSub.status === 200, "Parent allowed linked child submission (200)");

    // Test 8: Parent accessing Other Child Submission (Cross-student attack)
    console.log("\n--- Test 8: Parent accessing Other Student Submission ---");
    const resOtherSub = await GET(createReq(`http://localhost:3000/uploads/${fnOtherSub}`, tokenParentA), {
      params: Promise.resolve({ filename: fnOtherSub }),
    });
    assert(resOtherSub.status === 403, "Parent forbidden from other student's submission (403)");

    // Test 9: Parent accessing Arbitrary Upload File (Strict Containment)
    console.log("\n--- Test 9: Strict Containment (Arbitrary Upload) ---");
    const resArbitrary = await GET(createReq(`http://localhost:3000/uploads/${fnArbitrary}`, tokenParentA), {
      params: Promise.resolve({ filename: fnArbitrary }),
    });
    assert(resArbitrary.status === 403, "Parent forbidden from arbitrary non-assignment file (403)");

    // Test 10: Admin role permitted for arbitrary file
    console.log("\n--- Test 10: Admin Role Access ---");
    const resAdmin = await GET(createReq(`http://localhost:3000/uploads/${fnArbitrary}`, tokenAdmin), {
      params: Promise.resolve({ filename: fnArbitrary }),
    });
    assert(resAdmin.status === 200, "Admin allowed access to upload file (200)");

    // Test 11: Dual Auth via Cookie accessToken
    console.log("\n--- Test 11: Dual Auth via Cookie ---");
    const resCookieAuth = await GET(createReq(`http://localhost:3000/uploads/${fnPublic}`, undefined, tokenParentA), {
      params: Promise.resolve({ filename: fnPublic }),
    });
    assert(resCookieAuth.status === 200, "Parent authorized via cookie accessToken (200)");

    console.log(`\n========================================`);
    console.log(`Test Results: ${testsPassed} / ${testsTotal} Passed (${((testsPassed / testsTotal) * 100).toFixed(1)}%)`);
    console.log(`========================================`);

    if (testsPassed !== testsTotal) {
      throw new Error(`Only ${testsPassed}/${testsTotal} tests passed!`);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    throw err;
  } finally {
    console.log("\nCleaning up test resources...");
    for (const f of cleanupIds.files) {
      await fs.unlink(f).catch(() => {});
    }
    await User.deleteMany({ _id: { $in: cleanupIds.users } });
    await Parent.deleteMany({ _id: { $in: cleanupIds.parents } });
    await Student.deleteMany({ _id: { $in: cleanupIds.students } });
    await ParentStudentLink.deleteMany({ _id: { $in: cleanupIds.links } });
    await Batch.deleteMany({ _id: { $in: cleanupIds.batches } });
    await Enrollment.deleteMany({ _id: { $in: cleanupIds.enrollments } });
    await Assignment.deleteMany({ _id: { $in: cleanupIds.assignments } });
    await AssignmentAttachment.deleteMany({ _id: { $in: cleanupIds.attachments } });
    await AssignmentSubmission.deleteMany({ _id: { $in: cleanupIds.submissions } });
    await mongoose.disconnect();
    console.log("Cleanup complete. Mongoose disconnected.");
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
