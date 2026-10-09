const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function runIntegrityCheck() {
  await mongoose.connect('mongodb://localhost:27017/lmsca');
  const db = mongoose.connection.useDb('lmsca');
  
  console.log("Starting Cross-Domain Integrity Check...");
  
  const issues = [];
  
  // 1. ParentStudentLink integrity
  const PSL = db.collection('parentstudentlinks');
  const Parents = db.collection('parents');
  const Students = db.collection('students');
  
  const links = await PSL.find({ isDeleted: { $ne: true } }).toArray();
  for (const link of links) {
    const p = await Parents.findOne({ _id: link.parent, isDeleted: { $ne: true } });
    if (!p) issues.push(`ParentStudentLink ${link._id}: Orphaned Parent ${link.parent}`);
    
    const s = await Students.findOne({ _id: link.student, isDeleted: { $ne: true } });
    if (!s) issues.push(`ParentStudentLink ${link._id}: Orphaned Student ${link.student}`);
  }
  
  // 2. BatchStudent integrity
  const BatchStudents = db.collection('batchstudents');
  const Batches = db.collection('batches');
  const bLinks = await BatchStudents.find({ isDeleted: { $ne: true } }).toArray();
  
  for (const link of bLinks) {
    const b = await Batches.findOne({ _id: link.batch, isDeleted: { $ne: true } });
    if (!b) issues.push(`BatchStudent ${link._id}: Orphaned Batch ${link.batch}`);
    
    const s = await Students.findOne({ _id: link.student, isDeleted: { $ne: true } });
    if (!s) issues.push(`BatchStudent ${link._id}: Orphaned Student ${link.student}`);
  }

  // 3. ParentTeacherMessage integrity
  const PTM = db.collection('parentteachermessages');
  const Teachers = db.collection('teachers');
  const msgs = await PTM.find({ isDeleted: { $ne: true } }).toArray();
  for (const msg of msgs) {
    const p = await Parents.findOne({ _id: msg.parent, isDeleted: { $ne: true } });
    if (!p) issues.push(`Message ${msg._id}: Orphaned Parent ${msg.parent}`);
    const s = await Students.findOne({ _id: msg.student, isDeleted: { $ne: true } });
    if (!s) issues.push(`Message ${msg._id}: Orphaned Student ${msg.student}`);
    const t = await Teachers.findOne({ _id: msg.teacher, isDeleted: { $ne: true } });
    if (!t) issues.push(`Message ${msg._id}: Orphaned Teacher ${msg.teacher}`);
    const b = await Batches.findOne({ _id: msg.batch, isDeleted: { $ne: true } });
    if (!b) issues.push(`Message ${msg._id}: Orphaned Batch ${msg.batch}`);
  }

  // 4. Assignments & Submissions
  const Assignments = db.collection('assignments');
  const Submissions = db.collection('assignmentsubmissions');
  const subs = await Submissions.find({ isDeleted: { $ne: true } }).toArray();
  
  for (const sub of subs) {
    const a = await Assignments.findOne({ _id: sub.assignment, isDeleted: { $ne: true } });
    if (!a) issues.push(`Submission ${sub._id}: Orphaned Assignment ${sub.assignment}`);
    
    const s = await Students.findOne({ _id: sub.student, isDeleted: { $ne: true } });
    if (!s) issues.push(`Submission ${sub._id}: Orphaned Student ${sub.student}`);
  }
  
  console.log("\n--- Integrity Check Results ---");
  if (issues.length === 0) {
    console.log("PASS: No orphaned or stale references found in core collections.");
  } else {
    console.log(`FAIL: Found ${issues.length} integrity issues:`);
    issues.forEach(i => console.log(" - " + i));
  }
  
  process.exit(0);
}

runIntegrityCheck().catch(console.error);
