const mongoose = require('mongoose');
require('dotenv').config({ path: ['.env.local', '.env'] });

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');

async function seedExamples() {
  if (!confirm) {
    console.log("Production example seed not confirmed. No changes made.");
    console.log("Run with --confirm to execute.");
    process.exit(0);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("Error: MONGODB_URI not set.");
    process.exit(1);
  }
  
  console.log("Connecting to MONGODB_URI=***REDACTED***");
  await mongoose.connect(uri);
  const db = mongoose.connection;
  
  console.log("--- Collection Counts ---");
  const count = async (coll) => db.collection(coll).countDocuments();
  console.log(`Courses: ${await count('courses')}`);
  console.log(`Batches: ${await count('batches')}`);
  console.log(`Teachers: ${await count('users')}`); // simplified
  console.log(`Students: ${await count('students')}`);
  console.log(`Assignments: ${await count('assignments')}`);
  console.log(`Assessments: ${await count('assessments')}`);

  // Find valid structure
  const batch = await db.collection('batches').findOne({});
  if (!batch) {
    console.log("Error: No existing batches found. Cannot seed without existing academic structure.");
    process.exit(1);
  }
  
  console.log(`\nSelected Batch: ${batch._id}`);
  console.log(`Selected Course: ${batch.course}`);
  console.log(`Selected Teacher: ${batch.primaryTeacher}`);
  
  // SEED ASSIGNMENT
  const asmTitle = "Algebra Practice Assignment";
  let existingAsm = await db.collection('assignments').findOne({ title: asmTitle, batch: batch._id });
  if (existingAsm) {
    console.log(`Reused Assignment: ${asmTitle} (${existingAsm._id})`);
  } else {
    const asm = {
      title: asmTitle,
      totalMarks: 100,
      passingMarks: 40,
      batch: batch._id,
      course: batch.course,
      cohort: batch.cohort,
      teacher: batch.primaryTeacher,
      dueDate: new Date(Date.now() + 7 * 24 * 3600000),
      assignmentCode: `ASM-${Date.now().toString().slice(-4)}`,
      status: "published",
      type: "homework",
      visibility: "public",
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await db.collection('assignments').insertOne(asm);
    console.log(`Created Assignment: ${asmTitle} (${res.insertedId})`);
  }

  // SEED ASSESSMENT
  const assmtTitle = "Mathematics Practice Quiz";
  let existingAssmt = await db.collection('assessments').findOne({ title: assmtTitle, batch: batch._id });
  let assmtId;
  if (existingAssmt) {
    assmtId = existingAssmt._id;
    console.log(`Reused Assessment: ${assmtTitle} (${existingAssmt._id})`);
  } else {
    const assmt = {
      title: assmtTitle,
      totalMarks: 20,
      passingMarks: 10,
      batch: batch._id,
      course: batch.course,
      cohort: batch.cohort,
      teacher: batch.primaryTeacher,
      type: "quiz",
      status: "published",
      duration: 30,
      maxAttempts: 3,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await db.collection('assessments').insertOne(assmt);
    assmtId = res.insertedId;
    console.log(`Created Assessment: ${assmtTitle} (${res.insertedId})`);

    // Add Questions
    const q1 = {
      text: "What is 12 × 8?",
      type: "mcq",
      questionCode: `Q-${Date.now().toString().slice(-6)}-1`,
      options: [
        { text: "86", isCorrect: false },
        { text: "96", isCorrect: true },
        { text: "108", isCorrect: false },
        { text: "116", isCorrect: false }
      ],
      marks: 10,
      difficulty: "easy",
      course: batch.course,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const q2 = {
      text: "Which number is prime?",
      type: "mcq",
      questionCode: `Q-${Date.now().toString().slice(-6)}-2`,
      options: [
        { text: "21", isCorrect: false },
        { text: "27", isCorrect: false },
        { text: "29", isCorrect: true },
        { text: "33", isCorrect: false }
      ],
      marks: 10,
      difficulty: "medium",
      course: batch.course,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const qRes = await db.collection('questionbanks').insertMany([q1, q2]);
    console.log(`Created QuestionBank entries: ${Object.values(qRes.insertedIds).join(', ')}`);

    // Link Questions to Assessment
    const aq1 = {
      assessment: assmtId,
      question: qRes.insertedIds[0],
      order: 1,
      marks: 10
    };
    const aq2 = {
      assessment: assmtId,
      question: qRes.insertedIds[1],
      order: 2,
      marks: 10
    };
    await db.collection('assessmentquestions').insertMany([aq1, aq2]);
    console.log("Linked AssessmentQuestions");
  }

  mongoose.disconnect();
  console.log("\nSeed completed successfully.");
}

seedExamples();
