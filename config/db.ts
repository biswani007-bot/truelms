import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";
import "../models";

let isConnected = false;

export const connectDB = async () => {
  mongoose.set("strictQuery", true);

  if (isConnected) {
    logger.info("MongoDB is already connected.");
    return;
  }

  try {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // ignore if custom DNS configuration fails
    }

    const db = await mongoose.connect(env.MONGODB_URI, { family: 4 });
    isConnected = db.connections[0].readyState === 1;
    logger.info("MongoDB connected successfully.");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection failed:");
    throw new Error("MongoDB connection failed.");
  }
};
