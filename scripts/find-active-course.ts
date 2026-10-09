import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";

async function findActiveCourse() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");
  const Courses = db.collection("courses");
  const courses = await Courses.find({ isDeleted: { $ne: true } }).toArray();
  for (const c of courses) {
    console.log(c._id, c.courseCode, c.slug, c.courseName);
  }
  process.exit(0);
}
findActiveCourse();
