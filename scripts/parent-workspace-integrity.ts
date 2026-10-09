import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { AssessmentResult } from "../models/assessment-result.model";
import { AssignmentSubmission } from "../models/assignment-submission.model";
import { AssignmentEvaluation } from "../models/assignment-evaluation.model";
import { Assessment } from "../models/assessment.model";

async function runIntegrityCheck() {
  await connectDB();
  console.log("=== TrueLern Parent Workspace Integrity ===");

  try {
    // Target: Artificial "Full Stack Engineering", "Next.js", "QA Fullstack", "UAT" records
    const regexPattern = /UAT|Backend Core Architecture|test|Full Stack Engineering|Next\.js|QA Fullstack/i;

    console.log("Locating artificial assessments...");
    const artificialAssessments = await Assessment.find({
      $or: [
        { title: { $regex: regexPattern } },
        { description: { $regex: regexPattern } }
      ]
    });

    for (const asm of artificialAssessments) {
      console.log(`- Removing artificial assessment: ${asm.title}`);
      await AssessmentResult.deleteMany({ assessment: asm._id });
      await Assessment.deleteOne({ _id: asm._id });
    }

    console.log("\nLocating artificial assignments...");
    const artificialAssignments = await mongoose.model("Assignment").find({
      $or: [
        { title: { $regex: regexPattern } },
        { description: { $regex: regexPattern } }
      ]
    });

    for (const asn of artificialAssignments) {
      console.log(`- Removing artificial assignment: ${asn.title}`);
      const submissions = await AssignmentSubmission.find({ assignment: asn._id });
      for (const sub of submissions) {
        await AssignmentEvaluation.deleteMany({ submission: sub._id });
        await AssignmentSubmission.deleteOne({ _id: sub._id });
      }
      await mongoose.model("Assignment").deleteOne({ _id: asn._id });
    }

    console.log("\nLocating artificial courses...");
    const artificialCourses = await mongoose.model("Course").find({
      $or: [
        { courseName: { $regex: regexPattern } }
      ]
    });

    for (const crs of artificialCourses) {
      console.log(`- Removing artificial course: ${crs.courseName}`);
      await mongoose.model("Course").deleteOne({ _id: crs._id });
    }

    console.log("\nLocating artificial batches...");
    const artificialBatches = await mongoose.model("Batch").find({
      $or: [
        { batchName: { $regex: regexPattern } }
      ]
    });

    for (const batch of artificialBatches) {
      console.log(`- Removing artificial batch: ${batch.batchName}`);
      await mongoose.model("Batch").deleteOne({ _id: batch._id });
    }

    console.log("\nIntegrity check complete. Academic data restored to canonical state.");
  } catch (error) {
    console.error("Integrity check failed:", error);
  } finally {
    process.exit(0);
  }
}

runIntegrityCheck();
