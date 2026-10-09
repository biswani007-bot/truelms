import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { LiveClass } from "../models/live-class.model";

async function inspect() {
  await connectDB();
  const classes = await LiveClass.find({
    startDate: {
      $gte: new Date("2026-10-08T00:00:00.000Z"),
      $lte: new Date("2026-10-11T23:59:59.999Z")
    }
  })
    .populate("batch")
    .populate("course")
    .populate("teacher")
    .lean();

  console.log(`Classes around Oct 9, 2026: ${classes.length}`);
  for (const c of classes) {
    console.log(JSON.stringify({
      id: c._id,
      classCode: c.classCode,
      classTitle: c.classTitle,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      batch: c.batch,
      course: c.course,
      teacher: c.teacher
    }, null, 2));
  }
  await mongoose.disconnect();
}

inspect().catch(console.error);
