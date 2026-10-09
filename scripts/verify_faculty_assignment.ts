import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import { DemoTeacherService } from "../services/demo/demo-teacher.service";
import { ParentService } from "../services/parent/parent.service";
import { Course } from "../models/course.model";
import { Teacher } from "../models/teacher.model";
import { DemoSession } from "../models/demo-session.model";
import { Parent } from "../models/parent.model";
import { Student } from "../models/student.model";
import { Lead } from "../models/lead.model";

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

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI!, { family: 4 });
  console.log("\n==================================================");
  console.log("TrueLern — Demo Faculty Assignment Verification");
  console.log("==================================================\n");

  const cleanupDemoIds: mongoose.Types.ObjectId[] = [];
  let testCourse: any = null;
  let primaryTeacher: any = null;
  let secondaryTeacher: any = null;
  let backupTeacher: any = null;
  let unrelatedTeacher: any = null;
  let testParent: any = null;
  let testStudent: any = null;

  try {
    // 0. Setup test fixture entities
    const activeTeachers = await Teacher.find({ status: "active", isDeleted: { $ne: true } }).limit(4);
    if (activeTeachers.length < 3) {
      throw new Error(`Need at least 3 active teachers for test suite, found ${activeTeachers.length}`);
    }
    [primaryTeacher, secondaryTeacher, backupTeacher] = activeTeachers;
    if (activeTeachers.length >= 4) {
      unrelatedTeacher = activeTeachers[3];
    } else {
      // Find or create unrelated teacher
      unrelatedTeacher = await Teacher.findOne({
        _id: { $nin: [primaryTeacher._id, secondaryTeacher._id, backupTeacher._id] },
        status: "active",
      });
    }

    testParent = await Parent.findOne({ email: "parent@truelern.com" }) || await Parent.findOne();
    testStudent = await Student.findOne({ studentId: "STU-00466694" }) || await Student.findOne();

    const existingCourse = await Course.findById("6a8d4d384349078373f1fd52");

    // Create a dedicated isolated test course
    testCourse = await Course.create({
      courseName: "Test Faculty Assignment Course",
      courseCode: `TL-TEST-${Date.now().toString().slice(-4)}`,
      slug: `test-faculty-assignment-${Date.now()}`,
      category: existingCourse?.category || new mongoose.Types.ObjectId(),
      level: "beginner",
      shortDescription: "Short test description",
      longDescription: "Detailed test course description for faculty assignment tests.",
      duration: 10,
      durationUnit: "weeks",
      difficulty: "easy",
      deliveryMode: "live-cohort",
      certificateAvailable: true,
      featured: false,
      status: "published",
      version: "1.0.0",
      demoFaculty: {
        primaryTeacher: primaryTeacher._id,
        eligibleTeachers: [secondaryTeacher._id],
        backupTeacher: backupTeacher._id,
      },
    });

    const slotStart = new Date("2026-11-20T10:00:00.000Z");
    const slotEnd = new Date("2026-11-20T10:45:00.000Z");

    // =========================================================================
    // Test 1: Available primary teacher is assigned
    // =========================================================================
    {
      const res = await DemoTeacherService.selectDemoTeacher(testCourse._id, slotStart, slotEnd);
      const passed =
        res.status === "assigned" &&
        res.selectionRole === "primary" &&
        res.teacher?._id?.toString() === primaryTeacher._id.toString();
      record(1, "An available primary teacher is assigned", passed, `Assigned: ${res.teacher?.firstName} (${res.selectionRole})`);
    }

    // =========================================================================
    // Test 2: An unavailable primary teacher falls back to another eligible teacher
    // =========================================================================
    {
      // Create conflicting demo for primary teacher
      const conflictDemo = await DemoSession.create({
        demoCode: `DEMO-CONF-P-${Date.now()}`,
        lead: new mongoose.Types.ObjectId(),
        teacher: primaryTeacher._id,
        course: testCourse._id,
        scheduledStart: slotStart,
        scheduledEnd: slotEnd,
        duration: 45,
        meetingLink: "/test/join",
        status: "scheduled",
      });
      cleanupDemoIds.push(conflictDemo._id);

      const res = await DemoTeacherService.selectDemoTeacher(testCourse._id, slotStart, slotEnd);
      const passed =
        res.status === "assigned" &&
        res.selectionRole === "eligible" &&
        res.teacher?._id?.toString() === secondaryTeacher._id.toString();
      record(2, "An unavailable primary teacher falls back to another eligible teacher", passed, `Assigned: ${res.teacher?.firstName} (${res.selectionRole})`);
    }

    // =========================================================================
    // Test 3: The backup teacher is selected when appropriate
    // =========================================================================
    {
      // Create conflicting demo for secondary teacher as well
      const conflictDemo2 = await DemoSession.create({
        demoCode: `DEMO-CONF-S-${Date.now()}`,
        lead: new mongoose.Types.ObjectId(),
        teacher: secondaryTeacher._id,
        course: testCourse._id,
        scheduledStart: slotStart,
        scheduledEnd: slotEnd,
        duration: 45,
        meetingLink: "/test/join",
        status: "scheduled",
      });
      cleanupDemoIds.push(conflictDemo2._id);

      const res = await DemoTeacherService.selectDemoTeacher(testCourse._id, slotStart, slotEnd);
      const passed =
        res.status === "assigned" &&
        res.selectionRole === "backup" &&
        res.teacher?._id?.toString() === backupTeacher._id.toString();
      record(3, "The backup teacher is selected when appropriate", passed, `Assigned: ${res.teacher?.firstName} (${res.selectionRole})`);
    }

    // =========================================================================
    // Test 4: A genuine schedule conflict prevents assignment
    // =========================================================================
    {
      // Check conflict detection on primary teacher (who has an active scheduled session)
      const conflictCheck = await DemoTeacherService.checkTeacherConflict(primaryTeacher._id, slotStart, slotEnd);
      let assignThrew = false;

      // Create a test unassigned demo at that same time
      const testDemo = await DemoSession.create({
        demoCode: `DEMO-TEST-4-${Date.now()}`,
        lead: new mongoose.Types.ObjectId(),
        course: testCourse._id,
        scheduledStart: slotStart,
        scheduledEnd: slotEnd,
        duration: 45,
        meetingLink: "/test/join",
        status: "scheduled",
      });
      cleanupDemoIds.push(testDemo._id);

      try {
        await DemoTeacherService.assignOrReassignDemoTeacher(
          testDemo._id,
          primaryTeacher._id,
          "6a87cd424f07e3ff07aa7d03",
          "Forced assignment"
        );
      } catch (err: any) {
        assignThrew = err.message?.includes("Conflict") || err.statusCode === 400;
      }

      const passed = !conflictCheck.available && assignThrew;
      record(4, "A genuine schedule conflict prevents assignment", passed, `conflictCheck.available=${conflictCheck.available}, assignRejected=${assignThrew}`);
    }

    // =========================================================================
    // Test 5: Completed or cancelled sessions do not create false conflicts
    // =========================================================================
    {
      const nonConflictSlotStart = new Date("2026-11-21T14:00:00.000Z");
      const nonConflictSlotEnd = new Date("2026-11-21T14:45:00.000Z");

      // Create completed session
      const completedDemo = await DemoSession.create({
        demoCode: `DEMO-COMPL-${Date.now()}`,
        lead: new mongoose.Types.ObjectId(),
        teacher: primaryTeacher._id,
        course: testCourse._id,
        scheduledStart: nonConflictSlotStart,
        scheduledEnd: nonConflictSlotEnd,
        duration: 45,
        meetingLink: "/test/join",
        status: "completed",
      });
      cleanupDemoIds.push(completedDemo._id);

      // Create cancelled session
      const cancelledDemo = await DemoSession.create({
        demoCode: `DEMO-CANC-${Date.now()}`,
        lead: new mongoose.Types.ObjectId(),
        teacher: primaryTeacher._id,
        course: testCourse._id,
        scheduledStart: nonConflictSlotStart,
        scheduledEnd: nonConflictSlotEnd,
        duration: 45,
        meetingLink: "/test/join",
        status: "cancelled",
      });
      cleanupDemoIds.push(cancelledDemo._id);

      const check = await DemoTeacherService.checkTeacherConflict(primaryTeacher._id, nonConflictSlotStart, nonConflictSlotEnd);
      const passed = check.available === true;
      record(5, "Completed or cancelled sessions do not create false conflicts", passed, `available=${check.available}`);
    }

    // =========================================================================
    // Test 6: A teacher outside the configured eligible list cannot be assigned through a forged API request
    // =========================================================================
    {
      const freeSlotStart = new Date("2026-11-22T08:00:00.000Z");
      const freeSlotEnd = new Date("2026-11-22T08:45:00.000Z");

      const demoForForged = await DemoSession.create({
        demoCode: `DEMO-FORGE-${Date.now()}`,
        lead: new mongoose.Types.ObjectId(),
        course: testCourse._id,
        scheduledStart: freeSlotStart,
        scheduledEnd: freeSlotEnd,
        duration: 45,
        meetingLink: "/test/join",
        status: "scheduled",
      });
      cleanupDemoIds.push(demoForForged._id);

      let rejected = false;
      let rejectMessage = "";
      try {
        if (unrelatedTeacher) {
          await DemoTeacherService.assignOrReassignDemoTeacher(
            demoForForged._id,
            unrelatedTeacher._id,
            "6a87cd424f07e3ff07aa7d03",
            "Forged attempt"
          );
        } else {
          rejected = true;
        }
      } catch (err: any) {
        rejected = true;
        rejectMessage = err.message || "";
      }

      const passed = rejected && rejectMessage.includes("not configured as eligible demo faculty");
      record(6, "A teacher outside the configured eligible list cannot be assigned through a forged API request", passed, `Rejected: ${rejectMessage}`);
    }

    // =========================================================================
    // Test 7: Manual assignment persists and appears in Admin, Teacher and Parent views
    // =========================================================================
    {
      const manualSlotStart = new Date("2026-11-23T11:00:00.000Z");
      const manualSlotEnd = new Date("2026-11-23T11:45:00.000Z");

      const demoForManual = await DemoSession.create({
        demoCode: `DEMO-MANUAL-${Date.now()}`,
        lead: new mongoose.Types.ObjectId(),
        parent: testParent?._id,
        student: testStudent?._id,
        interestedCourse: testCourse.courseName,
        course: testCourse._id,
        scheduledStart: manualSlotStart,
        scheduledEnd: manualSlotEnd,
        duration: 45,
        meetingLink: "/test/join",
        status: "scheduled",
      });
      cleanupDemoIds.push(demoForManual._id);

      // Perform manual assignment
      await DemoTeacherService.assignOrReassignDemoTeacher(
        demoForManual._id,
        primaryTeacher._id,
        "6a87cd424f07e3ff07aa7d03",
        "Admin manual assignment"
      );

      // 1. Admin view persistence
      const adminDoc = await DemoSession.findById(demoForManual._id).populate("teacher");
      const adminOk = adminDoc?.teacher && (adminDoc.teacher as any)._id?.toString() === primaryTeacher._id.toString();

      // 2. Teacher view persistence
      const teacherDemos = await DemoTeacherService.getTeacherAssignedDemos(primaryTeacher._id, primaryTeacher.user);
      const teacherOk = teacherDemos.some(d => d._id.toString() === demoForManual._id.toString());

      // 3. Parent view persistence
      let parentOk = false;
      if (testParent && testStudent) {
        const parentDemoView = await ParentService.getParentDemo(testParent._id, testStudent._id.toString());
        parentOk = parentDemoView?.teacher?.name === `${primaryTeacher.firstName} ${primaryTeacher.lastName}`.trim() &&
                   parentDemoView?.teacherStatus === "Assigned";
      } else {
        parentOk = true;
      }

      const passed = Boolean(adminOk && teacherOk && parentOk);
      record(7, "Manual assignment persists and appears in Admin, Teacher and Parent views", passed, `Admin: ${adminOk}, Teacher: ${teacherOk}, Parent: ${parentOk}`);
    }

    // =========================================================================
    // Test 8: Parent demo booking automatically assigns an available configured teacher
    // =========================================================================
    {
      const autoSlotStart = new Date("2026-11-24T16:00:00.000Z");
      const autoSlotEnd = new Date("2026-11-24T16:45:00.000Z");

      // Parent booking using free-form scheduleParentDemo
      let autoBooked: any = null;
      if (testParent && testStudent) {
        // Clear any active demos for this child to avoid duplicate guard
        await DemoSession.updateMany(
          { parent: testParent._id, student: testStudent._id, status: { $in: ["scheduled", "live"] } },
          { $set: { status: "cancelled" } }
        );

        autoBooked = await ParentService.scheduleParentDemo(
          testParent._id,
          testStudent._id,
          {
            courseId: testCourse._id.toString(),
            programInterest: testCourse.courseName,
            preferredDate: "2026-11-24",
            preferredTime: "04:00 PM",
          }
        );
        if (autoBooked?.demoId) cleanupDemoIds.push(autoBooked.demoId);
      }

      const dbDemo = autoBooked?.demoId ? await DemoSession.findById(autoBooked.demoId) : null;
      const passed = Boolean(dbDemo && dbDemo.teacher && dbDemo.teacher.toString() === primaryTeacher._id.toString());
      record(8, "Parent demo booking automatically assigns an available configured teacher", passed, `Assigned: ${dbDemo?.teacher}`);
    }

    // =========================================================================
    // Test 9: No eligible teacher leaves a clear pending state without corrupting booking
    // =========================================================================
    {
      // Create a slot where ALL configured teachers (primary, secondary, backup) have conflicts
      const busySlotStart = new Date("2026-11-25T10:00:00.000Z");
      const busySlotEnd = new Date("2026-11-25T10:45:00.000Z");

      for (const t of [primaryTeacher, secondaryTeacher, backupTeacher]) {
        const cDemo = await DemoSession.create({
          demoCode: `DEMO-BUSY-${t._id}-${Date.now()}`,
          lead: new mongoose.Types.ObjectId(),
          teacher: t._id,
          course: testCourse._id,
          scheduledStart: busySlotStart,
          scheduledEnd: busySlotEnd,
          duration: 45,
          meetingLink: "/test/join",
          status: "scheduled",
        });
        cleanupDemoIds.push(cDemo._id);
      }

      // Check selection when all busy
      const selection = await DemoTeacherService.selectDemoTeacher(testCourse._id, busySlotStart, busySlotEnd);
      const isUnassigned = selection.teacher === null && selection.status === "assignment_required";

      // Also verify faculty availability report shows them as unavailable with reasons
      const availItems = await DemoTeacherService.getCourseFacultyAvailability(testCourse._id, busySlotStart, busySlotEnd);
      const allUnavailable = availItems.every(item => item.available === false && Boolean(item.conflictReason || item.reason));

      const passed = isUnassigned && allUnavailable;
      record(9, "No eligible teacher leaves a clear pending state without corrupting the booking", passed, `Status: ${selection.status}, Teachers Unavailable with Reasons: ${allUnavailable}`);
    }

    // =========================================================================
    // Test 10: Changing Course Demo Faculty updates subsequent candidate evaluations
    // =========================================================================
    {
      const evalSlotStart = new Date("2026-11-26T12:00:00.000Z");
      const evalSlotEnd = new Date("2026-11-26T12:45:00.000Z");

      // Swap primaryTeacher to backupTeacher on the course
      await Course.findByIdAndUpdate(testCourse._id, {
        "demoFaculty.primaryTeacher": backupTeacher._id,
        "demoFaculty.eligibleTeachers": [primaryTeacher._id],
        "demoFaculty.backupTeacher": secondaryTeacher._id,
      });

      const resAfterUpdate = await DemoTeacherService.selectDemoTeacher(testCourse._id, evalSlotStart, evalSlotEnd);
      const availAfterUpdate = await DemoTeacherService.getCourseFacultyAvailability(testCourse._id, evalSlotStart, evalSlotEnd);

      const newPrimaryItem = availAfterUpdate.find(i => i.role === "primary");
      const passed =
        resAfterUpdate.teacher?._id?.toString() === backupTeacher._id.toString() &&
        newPrimaryItem?.teacherId === backupTeacher._id.toString();

      record(10, "Changing Course Demo Faculty updates subsequent candidate evaluations", passed, `New Primary: ${newPrimaryItem?.name} (${newPrimaryItem?.teacherId})`);
    }

  } finally {
    // Clean up created test fixtures
    console.log("\nCleaning up test fixtures...");
    if (cleanupDemoIds.length > 0) {
      await DemoSession.deleteMany({ _id: { $in: cleanupDemoIds } });
    }
    if (testCourse?._id) {
      await Course.findByIdAndDelete(testCourse._id);
    }
    await mongoose.disconnect();
    console.log("Cleanup complete.\n");
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log("==================================================");
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${results.length} tests.`);
  console.log("==================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
