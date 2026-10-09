import "dotenv/config";
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

import { ParentService } from "../services/parent/parent.service";
import { Parent } from "../models/parent.model";
import { User } from "../models/user.model";
import { Lead } from "../models/lead.model";
import { Student } from "../models/student.model";
import { ParentStudentLink } from "../models/parent-student-link.model";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function runTests() {
  const start = Date.now();
  console.log("=== TrueLern Parent Identity & CRM Synchronization Test Suite ===");

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable not configured");
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    console.log(`[PASS] Connected to MongoDB in ${Date.now() - start}ms`);

    // ── Test 1: Authoritative Parent and User Account Consistency ─────────────
    console.log("\n[Test 1] Verifying authoritative Parent and User accounts...");
    const parent = await Parent.findOne({ email: "parent@truelern.com", isDeleted: { $ne: true } });
    if (!parent) throw new Error("Parent not found");
    if (!parent.user) throw new Error("Parent has no linked user account");

    const user = await User.findById(parent.user);
    if (!user) throw new Error("User account not found");

    if (parent.firstName !== "Robin" || parent.lastName !== "Hood") {
      throw new Error(`Unexpected parent name: ${parent.firstName} ${parent.lastName}`);
    }
    if (user.firstName !== "Robin" || user.lastName !== "Hood") {
      throw new Error(`Unexpected user name: ${user.firstName} ${user.lastName}`);
    }
    console.log(`[PASS] Parent (${parent.firstName} ${parent.lastName}) and User (${user.firstName} ${user.lastName}) match.`);

    // ── Test 2: Child Isolation Verification ──────────────────────────────────
    console.log("\n[Test 2] Verifying student / child identity isolation...");
    const links = await ParentStudentLink.find({ parent: parent._id, isDeleted: { $ne: true } }).populate("student");
    const activeStudentLinks = links.filter((l: any) => l.student && !l.student.isDeleted);
    console.log(`Found ${activeStudentLinks.length} active linked student ward(s).`);

    const targetStudent: any = activeStudentLinks.find((l: any) => l.student.studentId === "STU-00466694")?.student;
    if (!targetStudent) {
      throw new Error("Target student STU-00466694 (Alex Mishra) not linked to parent");
    }
    if (targetStudent.firstName !== "Alex" || targetStudent.lastName !== "Mishra") {
      throw new Error(`Student name mismatch: expected Alex Mishra, got ${targetStudent.firstName} ${targetStudent.lastName}`);
    }
    console.log(`[PASS] Child isolated: ${targetStudent.firstName} ${targetStudent.lastName} (${targetStudent.studentId}) is separate from parent.`);

    // ── Test 3: CRM Lead Linked to Parent & Child ─────────────────────────────
    console.log("\n[Test 3] Verifying CRM Lead resolution for target account...");
    const targetLeadId = new mongoose.Types.ObjectId("6abb59e1a5f7aba5d0890031");
    const lead = await Lead.findById(targetLeadId);
    if (!lead) throw new Error("Target lead not found");

    if (lead.fullName !== "Robin Hood") {
      throw new Error(`Target lead fullName mismatch: expected "Robin Hood", got "${lead.fullName}"`);
    }
    if (lead.parent?.toString() !== parent._id.toString()) {
      throw new Error(`Target lead parent reference mismatch: expected ${parent._id}, got ${lead.parent}`);
    }
    if (lead.student?.toString() !== targetStudent._id.toString()) {
      throw new Error(`Target lead student reference mismatch: expected ${targetStudent._id}, got ${lead.student}`);
    }
    console.log(`[PASS] CRM Lead (${lead.leadId}) correctly has fullName "${lead.fullName}", parent "${parent._id}", student "${targetStudent._id}".`);

    // ── Test 4: Profile Update Synchronization Test ──────────────────────────
    console.log("\n[Test 4] Testing parent profile update -> CRM Lead sync...");
    const userIdStr = (user._id as any).toString();

    // Perform update
    console.log("Simulating parent name update to 'Robin H.'...");
    await ParentService.updateParentProfile(userIdStr, {
      firstName: "Robin",
      lastName: "H.",
    });

    // Check Parent, User, and Lead
    const updatedParent = await Parent.findById(parent._id);
    const updatedUser = await User.findById(user._id);
    const updatedLead = await Lead.findById(targetLeadId);
    const unchangedStudent = await Student.findById(targetStudent._id);

    if (updatedParent?.firstName !== "Robin" || updatedParent?.lastName !== "H.") {
      throw new Error(`Parent update failed: ${updatedParent?.firstName} ${updatedParent?.lastName}`);
    }
    if (updatedUser?.firstName !== "Robin" || updatedUser?.lastName !== "H.") {
      throw new Error(`User update failed: ${updatedUser?.firstName} ${updatedUser?.lastName}`);
    }
    if (updatedLead?.fullName !== "Robin H.") {
      throw new Error(`CRM Lead did not synchronize! Expected "Robin H.", got "${updatedLead?.fullName}"`);
    }
    // Verify child isolation was maintained
    if (unchangedStudent?.firstName !== "Alex" || unchangedStudent?.lastName !== "Mishra") {
      throw new Error(`CRITICAL: Student was accidentally modified during parent profile update!`);
    }
    console.log("[PASS] Profile update synchronized to Lead ('Robin H.') without affecting Student ('Alex Mishra').");

    // ── Test 5: Restoration to Original Canonical Name ─────────────────────────
    console.log("\n[Test 5] Restoring parent profile to canonical 'Robin Hood'...");
    await ParentService.updateParentProfile(userIdStr, {
      firstName: "Robin",
      lastName: "Hood",
    });

    const restoredParent = await Parent.findById(parent._id);
    const restoredLead = await Lead.findById(targetLeadId);
    if (restoredParent?.lastName !== "Hood" || restoredLead?.fullName !== "Robin Hood") {
      throw new Error(`Restoration failed! Parent: ${restoredParent?.lastName}, Lead: ${restoredLead?.fullName}`);
    }
    console.log("[PASS] Successfully restored canonical identity 'Robin Hood'.");

    console.log(`\n=======================================================`);
    console.log(`ALL 5 TESTS PASSED SUCCESFULLY in ${Date.now() - start}ms!`);
    console.log(`=======================================================`);
  } catch (err: any) {
    console.error("\n[TEST FAILED]:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Mongoose disconnected cleanly.");
  }
}

runTests();
