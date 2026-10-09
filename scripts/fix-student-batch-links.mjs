/**
 * FINAL FIX: 
 * The original seed created batchstudent record for Alex in the Full Stack Engineering batch.
 * We need to update THAT existing record to point to Junior Foundation batch,
 * OR add a new batch record that has the enrollment field.
 * 
 * The API keeps returning Module 1 because there's a batchstudent in batchstudents collection
 * that was seeded with Alex's ID in batch 6a87011ffae35df7c876b0c1.
 * Let me check ALL documents regardless of indexes/filters.
 */
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('lmsca');

const alexId = new ObjectId('6a87011efae35df7c876b0ab');
const juniorBatchId = new ObjectId('6a890dbac480cc8f5fff12fc');
const oldBatchId = new ObjectId('6a87011ffae35df7c876b0c1');

// Check ALL records - NO FILTER WHATSOEVER
const cmd = await db.command({ 
  find: 'batchstudents',
  filter: { student: alexId }
});
console.log('Raw command result:');
console.log(JSON.stringify(cmd.cursor?.firstBatch || cmd, null, 2));

// Delete ALL Alex batchstudent records
const deleteResult = await db.collection('batchstudents').deleteMany({ student: alexId });
console.log('\nDeleted Alex batchstudent records:', deleteResult.deletedCount);

// Get Alex's enrollment 
const enrollment = await db.collection('enrollments').findOne({ student: alexId, isDeleted: { '$ne': true } });
console.log('Alex enrollment:', enrollment?._id, enrollment?.batch?.toString());

// Create a proper batchstudent record with all required fields
await db.collection('batchstudents').insertOne({
  _id: new ObjectId(),
  batch: juniorBatchId,
  student: alexId,
  enrollment: enrollment?._id || new ObjectId(),
  assignedAt: new Date(),
  assignmentType: 'manual',
  status: 'active',
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 0,
});
console.log('Created proper batchstudent record for Alex in Junior Foundation batch');

// Update enrollment to reference the Junior Foundation batch
if (enrollment) {
  const juniorBatch = await db.collection('batches').findOne({ _id: juniorBatchId });
  await db.collection('enrollments').updateOne(
    { _id: enrollment._id },
    { '$set': { batch: juniorBatchId, course: juniorBatch?.course, updatedAt: new Date() } }
  );
  console.log('Updated enrollment batch to Junior Foundation');
}

// VERIFY
const finalRecs = await db.collection('batchstudents').find({ student: alexId }).toArray();
console.log('\nFinal batchstudent records for Alex:', finalRecs.map(r => ({ batch: r.batch?.toString(), status: r.status, enrollment: r.enrollment?.toString() })));

const batchIds = finalRecs.map(r => r.batch);
const assigns = await db.collection('assignments').find({ 
  batch: { '$in': batchIds }, 
  status: 'published', 
  isDeleted: { '$ne': true } 
}).toArray();
console.log('Assignments visible to Alex:', assigns.map(a => a.title));

await client.close();
console.log('\nDone!');
process.exit(0);
