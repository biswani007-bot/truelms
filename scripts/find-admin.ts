import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";

async function findAdmin() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");
  const admin = await db.collection("users").findOne({ role: { $in: ["admin", "superadmin"] } });
  console.log("Admin email:", admin?.email);
  process.exit(0);
}

findAdmin().catch(console.error);
