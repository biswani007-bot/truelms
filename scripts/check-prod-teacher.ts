import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";

async function checkProdTeacher() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");
  const Users = db.collection("users");
  
  const teacher = await Users.findOne({ email: "teacher@truelern.com" });
  if (!teacher) {
    console.log("Teacher not found!");
  } else {
    console.log("Found teacher:");
    console.log("_id:", teacher._id);
    console.log("role:", teacher.role);
    console.log("isActive:", teacher.isActive);
    console.log("status:", teacher.status);
    console.log("hasPassword:", !!teacher.password);
    console.log("isDeleted:", teacher.isDeleted);
  }
  
  process.exit(0);
}
checkProdTeacher().catch(console.error);
