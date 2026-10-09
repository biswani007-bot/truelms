import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function checkPassword() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");
  const Users = db.collection("users");
  
  const teacher = await Users.findOne({ email: "teacher@truelern.com" });
  if (!teacher) {
    console.log("Teacher not found!");
    process.exit(1);
  }
  
  const isMatch = await bcrypt.compare("password123", teacher.password);
  console.log("Does 'password123' match the hash in DB?", isMatch);
  
  process.exit(0);
}
checkPassword().catch(console.error);
