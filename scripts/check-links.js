const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/lmsca').then(async () => {
  const links = await mongoose.connection.collection('parentstudentlinks').find({}).toArray();
  console.log('Total links:', links.length);
  console.log('Links:', JSON.stringify(links.slice(0,5), null, 2));
  
  const students = await mongoose.connection.collection('students').find({}).toArray();
  console.log('Total students:', students.length);
  console.log('Students:', JSON.stringify(students.slice(0,3), null, 2));
  
  process.exit(0);
});
