import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";

async function runIntegrityCheck() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");

  const LiveClasses = db.collection("liveclasses");
  const Courses = db.collection("courses");
  const Batches = db.collection("batches");
  const Teachers = db.collection("teachers");
  const BatchStudents = db.collection("batchstudents");
  const Attendances = db.collection("attendances");
  const Recordings = db.collection("liveclassrecordings");

  console.log("=== MILESTONE 4 INTEGRITY CHECK ===");

  const liveClasses = await LiveClasses.find({ isDeleted: { $ne: true } }).toArray();
  console.log(`Found ${liveClasses.length} active live classes.`);

  let inconsistencies = 0;

  for (const lc of liveClasses) {
    if (!lc.course) {
      console.error(`[ERROR] LiveClass ${lc.classCode} missing course reference.`);
      inconsistencies++;
    } else {
      const course = await Courses.findOne({ _id: lc.course });
      if (!course) {
        console.error(`[ERROR] LiveClass ${lc.classCode} references invalid course ${lc.course}`);
        inconsistencies++;
      }
    }

    if (!lc.batch) {
      console.error(`[ERROR] LiveClass ${lc.classCode} missing batch reference.`);
      inconsistencies++;
    } else {
      const batch = await Batches.findOne({ _id: lc.batch });
      if (!batch) {
        console.error(`[ERROR] LiveClass ${lc.classCode} references invalid batch ${lc.batch}`);
        inconsistencies++;
      } else if (lc.course && batch.course.toString() !== lc.course.toString()) {
        console.error(`[ERROR] LiveClass ${lc.classCode} course ${lc.course} mismatches Batch course ${batch.course}`);
        inconsistencies++;
      }
    }

    if (!lc.teacher) {
      console.error(`[ERROR] LiveClass ${lc.classCode} missing teacher reference.`);
      inconsistencies++;
    } else {
      const teacher = await Teachers.findOne({ _id: lc.teacher });
      if (!teacher) {
        console.error(`[ERROR] LiveClass ${lc.classCode} references invalid teacher ${lc.teacher}`);
        inconsistencies++;
      }
    }
  }

  const attendances = await Attendances.find({}).toArray();
  const attendanceSet = new Set();
  
  for (const att of attendances) {
    const lc = await LiveClasses.findOne({ _id: att.liveClass });
    if (!lc) {
      console.error(`[ERROR] Attendance ${att.attendanceNumber} references invalid live class ${att.liveClass}`);
      inconsistencies++;
    }

    const uniqueKey = `${att.liveClass.toString()}-${att.student.toString()}`;
    if (attendanceSet.has(uniqueKey)) {
      console.error(`[ERROR] Duplicate attendance for student ${att.student} in class ${att.liveClass}`);
      inconsistencies++;
    }
    attendanceSet.add(uniqueKey);

    const enrollment = await BatchStudents.findOne({ student: att.student, batch: att.batch });
    if (!enrollment) {
      console.error(`[ERROR] Attendance ${att.attendanceNumber} exists for student ${att.student} not enrolled in batch ${att.batch}`);
      inconsistencies++;
    }
  }

  const recordings = await Recordings.find({}).toArray();
  for (const rec of recordings) {
    const lc = await LiveClasses.findOne({ _id: rec.liveClass });
    if (!lc) {
      console.error(`[ERROR] Recording ${rec._id} references invalid live class ${rec.liveClass}`);
      inconsistencies++;
    }
  }

  if (inconsistencies === 0) {
    console.log("[PASS] All cross-domain integrity checks passed for Live Learning Lifecycle!");
  } else {
    console.log(`[FAIL] Found ${inconsistencies} inconsistencies.`);
  }

  process.exit(inconsistencies === 0 ? 0 : 1);
}

runIntegrityCheck().catch(console.error);
