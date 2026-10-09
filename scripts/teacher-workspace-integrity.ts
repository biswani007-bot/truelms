import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { AssessmentResult } from "../models/assessment-result.model";
import { assignmentSubmissionRepository } from "../repositories/assignment-submission.repository";
import { AssignmentSubmission } from "../models/assignment-submission.model";
import { AssignmentEvaluation } from "../models/assignment-evaluation.model";
import { Assessment } from "../models/assessment.model";

async function runIntegrityCheck() {
  await connectDB();
  console.log("=== TrueLern Teacher Workspace Integrity ===");

  try {
    // Target: Artificial "Backend Core Architecture Evaluation" and "UAT" records
    console.log("Locating artificial UAT assessments...");
    const artificialAssessments = await Assessment.find({
      $or: [
        { title: { $regex: /UAT/i } },
        { title: { $regex: /Backend Core Architecture/i } },
        { title: { $regex: /test/i } }
      ]
    });

    for (const asm of artificialAssessments) {
      console.log(`- Removing artificial assessment: ${asm.title}`);
      await AssessmentResult.deleteMany({ assessment: asm._id });
      await Assessment.deleteOne({ _id: asm._id });
    }

    console.log("\nLocating artificial UAT assignments...");
    const artificialAssignments = await mongoose.model("Assignment").find({
      $or: [
        { title: { $regex: /UAT/i } },
        { title: { $regex: /Backend Core Architecture/i } },
        { title: { $regex: /test/i } }
      ]
    });

    for (const asn of artificialAssignments) {
      console.log(`- Removing artificial assignment: ${asn.title}`);
      const submissions = await assignmentSubmissionRepository.findMany({ assignment: asn._id });
      for (const sub of submissions) {
        await AssignmentEvaluation.deleteMany({ submission: sub._id });
        await AssignmentSubmission.deleteOne({ _id: sub._id });
      }
      await mongoose.model("Assignment").deleteOne({ _id: asn._id });
    }

    console.log("\nIntegrity check complete. Academic data restored to canonical state.");
  } catch (error) {
    console.error("Integrity check failed:", error);
  } finally {
    process.exit(0);
  }
}

runIntegrityCheck();
