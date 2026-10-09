import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");
  
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const admin = await db.collection("users").findOneAndUpdate(
    { email: "admin@truelern.com" },
    {
      $set: {
        email: "admin@truelern.com",
        password: hashedPassword,
        name: "TrueLern Admin",
        role: "admin",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  console.log("Admin seeded:", admin?.email);
  process.exit(0);
}

seedAdmin().catch(console.error);
