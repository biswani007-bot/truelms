import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const hash = await bcrypt.hash("password123", 10);
  const user = await mongoose.connection.useDb("lmsca").collection("users").updateOne(
    { email: "teacher@truelern.com" },
    { $set: { password: hash } }
  );
  console.log("Password reset successful:", user.modifiedCount);
  process.exit(0);
}
run().catch(console.error);
