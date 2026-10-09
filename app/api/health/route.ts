
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Auto-generated summary for GET /api/health
 *     tags: [health]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";

export async function GET() {
  try {
    await connectDB();
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;

    return NextResponse.json(
      {
        status: isDbConnected ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        database: isDbConnected ? "connected" : "disconnected",
        uptimeSeconds: Math.round(process.uptime()),
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      },
      { status: isDbConnected ? 200 : 503 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: err?.message || "Health check failed",
      },
      { status: 500 }
    );
  }
}
