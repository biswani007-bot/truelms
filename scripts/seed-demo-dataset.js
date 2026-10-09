/**
 * TrueLern Production Demo Seeding Script
 * 
 * Non-destructive & Idempotent.
 * Sets up / synchronizes the verified demo entities for client presentations:
 * - Teacher: Elizabeth Vance (teacher@truelern.com)
 * - Student: Alex Mercer (student@truelern.com)
 * - Batch: Junior Foundation Academy / Full Stack Engineering
 * - Live Class: "Live Demo — Communication & Confidence" (LVC-DEMO-2026)
 * - Jitsi Room: truelern-6a8bcddbf8996599bd9cdf90
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function seedDemoDataset() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is required.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[TrueLern Demo Seed] Connected to MongoDB.');

  // 1. Resolve Teacher User & Profile
  const teacherUser = await mongoose.connection.collection('users').findOne({ email: 'teacher@truelern.com' });
  const teacher = await mongoose.connection.collection('teachers').findOne({ teacherCode: 'TCH-1001' })
               || await mongoose.connection.collection('teachers').findOne({});

  if (teacher && teacherUser && teacher.user?.toString() !== teacherUser._id.toString()) {
    await mongoose.connection.collection('teachers').updateOne(
      { _id: teacher._id },
      { $set: { user: teacherUser._id } }
    );
    console.log('[TrueLern Demo Seed] Synchronized teacher profile with teacher@truelern.com user account.');
  }

  // 2. Resolve Student User & Profile (Alex Mercer)
  const student = await mongoose.connection.collection('students').findOne({ studentId: 'STD-1001' });

  // 3. Resolve Course & Batch — requires seed-curriculum.js to have been run first
  // Use canonical slug: 'junior-foundation-ages-6-to-10' (from seed-curriculum.js)
  const course = await mongoose.connection.collection('courses').findOne({ 
    slug: 'junior-foundation-ages-6-to-10',
    status: 'published',
    isDeleted: { $ne: true }
  });
  const batch = await mongoose.connection.collection('batches').findOne({ batchCode: 'BAT-TL-JFOUND-01' })
               || await mongoose.connection.collection('batches').findOne({ isDeleted: { $ne: true } });

  if (!teacher || !student) {
    console.error('[TrueLern Demo Seed] Error: Teacher (teacher@truelern.com) or Student (STD-1001) not found in database.');
    console.error('[TrueLern Demo Seed] Please ensure the default admin seeder has been run and demo accounts exist.');
    await mongoose.disconnect();
    return;
  }

  if (!course) {
    console.error('[TrueLern Demo Seed] Error: Junior Foundation course not found.');
    console.error('[TrueLern Demo Seed] Run: node scripts/seed-curriculum.js FIRST.');
    await mongoose.disconnect();
    return;
  }

  if (!batch) {
    console.error('[TrueLern Demo Seed] Error: No batch found in database. Please create a batch first via the Admin portal.');
    await mongoose.disconnect();
    return;
  }

  console.log('[TrueLern Demo Seed] ✅ Core demo entities resolved:');
  console.log(`  - Teacher: ${teacher.firstName} ${teacher.lastName} (${teacher._id})`);
  console.log(`  - Student: ${student.firstName} ${student.lastName} (${student._id})`);
  console.log(`  - Course:  ${course.courseName} (${course._id})`);
  console.log(`  - Batch:   ${batch.batchName || batch.batchCode || 'Unnamed'} (${batch._id})`);


  // 4. Assign Teacher to Batch
  await mongoose.connection.collection('batches').updateOne(
    { _id: batch._id },
    { $set: { primaryTeacher: teacher._id, teacher: teacher._id } }
  );
  console.log('[TrueLern Demo Seed] Assigned teacher to batch.');

  // 5. Ensure Student Active Enrollment in Batch
  const existingBS = await mongoose.connection.collection('batchstudents').findOne({
    batch: batch._id,
    student: student._id
  });
  if (!existingBS) {
    await mongoose.connection.collection('batchstudents').insertOne({
      batch: batch._id,
      student: student._id,
      status: 'active',
      enrollmentDate: new Date(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('[TrueLern Demo Seed] Enrolled Alex Mercer into batch.');
  } else {
    await mongoose.connection.collection('batchstudents').updateOne(
      { _id: existingBS._id },
      { $set: { status: 'active', isDeleted: false } }
    );
    console.log('[TrueLern Demo Seed] Verified active enrollment for Alex Mercer.');
  }

  // 6. Seed / Update Deterministic Demo Live Class
  const demoClassCode = 'LVC-DEMO-2026';
  const existingClass = await mongoose.connection.collection('liveclasses').findOne({ classCode: demoClassCode });
  const scheduledDate = new Date(Date.now() - 5 * 60 * 1000); // Started 5 mins ago

  if (!existingClass) {
    const newClass = {
      classCode: demoClassCode,
      classTitle: 'Live Demo — Communication & Confidence',
      description: 'Interactive live session covering expressive communication, confidence building, and collaborative speaking exercises.',
      batch: batch._id,
      course: course._id,
      cohort: batch._id,
      teacher: teacher._id,
      classNumber: 1,
      startDate: scheduledDate,
      endDate: new Date(scheduledDate.getTime() + 45 * 60000),
      duration: 45,
      timezone: 'UTC',
      meetingPlatform: 'truelern',
      meetingLink: 'truelern-demo-room',
      recordingEnabled: true,
      status: 'scheduled',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await mongoose.connection.collection('liveclasses').insertOne(newClass);
    console.log('[TrueLern Demo Seed] Created Live Demo Class ID:', res.insertedId);
  } else {
    await mongoose.connection.collection('liveclasses').updateOne(
      { _id: existingClass._id },
      {
        $set: {
          classTitle: 'Live Demo — Communication & Confidence',
          teacher: teacher._id,
          batch: batch._id,
          course: course._id,
          startDate: scheduledDate,
          endDate: new Date(scheduledDate.getTime() + 45 * 60000),
          status: 'scheduled',
          isDeleted: false
        }
      }
    );
    console.log('[TrueLern Demo Seed] Synchronized Live Demo Class ID:', existingClass._id);
  }

  console.log('[TrueLern Demo Seed] Completed successfully.');
  await mongoose.disconnect();
}

seedDemoDataset().catch((err) => {
  console.error('[TrueLern Demo Seed] Execution error:', err);
  process.exit(1);
});
