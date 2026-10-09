import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";

async function runIntegrityCheck() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");

  const Enrollments = db.collection("enrollments");
  const Parents = db.collection("parents");
  const Students = db.collection("students");
  const ParentStudentLinks = db.collection("parentstudentlinks");
  const Invoices = db.collection("invoices");
  const Payments = db.collection("payments");
  const Courses = db.collection("courses");
  const Batches = db.collection("batches");
  const BatchStudents = db.collection("batchstudents");

  console.log("=== MILESTONE 3 INTEGRITY CHECK ===");

  const paidEnrollments = await Enrollments.find({ status: { $in: ["batch-assigned", "learning-started", "completed", "confirmed"] } }).toArray();
  console.log(`Found ${paidEnrollments.length} paid/active enrollments.`);

  let inconsistencies = 0;

  for (const enrollment of paidEnrollments) {
    const studentId = enrollment.student;
    const courseId = enrollment.course;

    const student = await Students.findOne({ _id: studentId });
    if (!student) {
      console.error(`[ERROR] Student missing for enrollment ${enrollment.enrollmentNumber}`);
      inconsistencies++;
    }

    const link = await ParentStudentLinks.findOne({ student: studentId });
    if (!link) {
      console.error(`[ERROR] ParentStudentLink missing for student ${studentId}`);
      inconsistencies++;
    } else {
      const parent = await Parents.findOne({ _id: link.parent });
      if (!parent) {
        console.error(`[ERROR] Parent missing for link ${link._id}`);
        inconsistencies++;
      }
    }

    const course = await Courses.findOne({ _id: courseId });
    if (!course) {
      console.error(`[ERROR] Course missing for enrollment ${enrollment.enrollmentNumber}`);
      inconsistencies++;
    }

    const invoice = await Invoices.findOne({ enrollment: enrollment._id });
    if (!invoice) {
      console.error(`[ERROR] Invoice missing for enrollment ${enrollment.enrollmentNumber}`);
      inconsistencies++;
    } else {
      if (invoice.status === "paid") {
        const payment = await Payments.findOne({ invoice: invoice._id });
        if (!payment) {
          console.error(`[ERROR] Payment missing for paid invoice ${invoice.invoiceNumber}`);
          inconsistencies++;
        }
      }
    }

    if (enrollment.status === "batch-assigned" || enrollment.status === "learning-started") {
      const batchStudent = await BatchStudents.findOne({ student: studentId, enrollment: enrollment._id });
      if (!batchStudent) {
        console.error(`[ERROR] BatchStudent missing for active enrollment ${enrollment.enrollmentNumber}`);
        inconsistencies++;
      } else {
        const batch = await Batches.findOne({ _id: batchStudent.batch });
        if (!batch) {
          console.error(`[ERROR] Batch missing for BatchStudent ${batchStudent._id}`);
          inconsistencies++;
        }
      }
    }
  }

  if (inconsistencies === 0) {
    console.log("[PASS] All cross-domain integrity checks passed!");
  } else {
    console.log(`[FAIL] Found ${inconsistencies} inconsistencies.`);
  }

  process.exit(inconsistencies === 0 ? 0 : 1);
}

runIntegrityCheck().catch(console.error);
