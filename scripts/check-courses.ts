import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkCourses() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const courses = await mongoose.connection.collection('courses').find({}, { projection: { courseName: 1, slug: 1, category: 1 } }).toArray();
  const cats = await mongoose.connection.collection('coursecategories').find({}).toArray();
  console.log("Categories:");
  cats.forEach(c => console.log(`- ${c.name} (${c.slug})`));
  console.log("Current Courses in DB:");
  courses.forEach(c => console.log(`- ${c.courseName} (${c.slug}) [Cat: ${c.category}]`));
  await mongoose.disconnect();
}
checkCourses().catch(console.error);
