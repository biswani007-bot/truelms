import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('lmsca');

// List all collections
const allColls = await db.listCollections().toArray();
console.log('All collections:\n' + allColls.map(c => c.name).sort().join('\n'));

// Parent-student link collection check
const parentLinkColls = allColls.filter(c => c.name.toLowerCase().includes('parent') || c.name.toLowerCase().includes('link'));
console.log('\nParent/Link colls:', parentLinkColls.map(c => c.name));

// Check parent
const parent = await db.collection('parents').findOne({ email: 'parent@truelern.com' });
console.log('\nParent:', parent?._id, parent?.firstName, parent?.email);

// Check parent-student links
const psLinks = await db.collection('parentstudentlinks').find({ parent: parent?._id }).toArray();
console.log('PSLinks:', psLinks.length, psLinks.map(l => ({ student: l.student?.toString(), canAccess: l.canAccessPortal })));

// Check Alex student
const alex = await db.collection('students').findOne({ firstName: 'Alex' });
console.log('\nAlex student:', alex?._id, alex?.firstName, alex?.lastName, alex?.status, 'isDeleted:', alex?.isDeleted);

// Check all students
const students = await db.collection('students').find({}).toArray();
console.log('\nAll students:', students.map(s => ({ id: s._id, name: s.firstName + ' ' + s.lastName, status: s.status, isDeleted: s.isDeleted })));

// Check batch students for Alex
if (alex) {
  const batchStudents = await db.collection('batchstudents').find({ student: alex._id }).toArray();
  console.log('\nBatch students for Alex:', batchStudents.map(b => ({ batch: b.batch?.toString(), status: b.status })));
}

await client.close();
process.exit(0);
