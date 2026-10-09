/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/config/db";
import { LiveClass } from "@/models/live-class.model";
import { ParticipationService } from "@/services/live-class/participation.service";
import { DemoParticipationService } from "@/services/demo/demo-participation.service";

/**
 * JITSI SERVER-SIDE WEBHOOK HANDLER
 * Receives presence & participant events from a self-hosted Jitsi instance
 * (e.g., via Jicofo event broadcaster, Prosody webhook module, or Jitsi Meet webhook plugin).
 *
 * Requirements:
 * - Header: 'x-jitsi-signature' (HMAC SHA-256 using JITSI_APP_SECRET) or 'authorization: Bearer <JITSI_APP_SECRET>'
 * - Payload:
 *   {
 *     "event": "PARTICIPANT_JOINED" | "PARTICIPANT_LEFT",
 *     "room_name": "truelern-<classId>",
 *     "participant": {
 *       "id": "<userId>",
 *       "role": "<role>",
 *       "email": "<email>",
 *       "studentId": "<studentId>"
 *     },
 *     "timestamp": 1789188000
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const secret = process.env.JITSI_APP_SECRET || "truelern_secure_jitsi_jwt_secret_key_2026";
    const signature = req.headers.get("x-jitsi-signature");
    const authHeader = req.headers.get("authorization");

    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Verify HMAC signature if present, or Bearer secret
    if (signature) {
      const expectedSig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    } else if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token !== secret) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook authorization secret" },
          { status: 401 }
        );
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Webhook authentication required" },
          { status: 401 }
        );
      }
    }

    const roomName = payload.room_name || payload.room;
    if (!roomName) {
      return NextResponse.json(
        { success: false, error: "room_name is required" },
        { status: 400 }
      );
    }

    // Resolve room type (LiveClass vs DemoSession)
    let classId = null;
    let isDemoSession = false;

    const demoMatch = roomName.match(/^truelern-demo-(.+)$/);
    if (demoMatch) {
      classId = demoMatch[1];
      isDemoSession = true;
    } else {
      const match = roomName.match(/^truelern-(.+)$/);
      classId = match ? match[1] : null;
    }

    if (!classId) {
      return NextResponse.json({
        success: true,
        message: "Ignored non-TrueLern room",
        data: { ignored: true },
      });
    }

    const eventType = (payload.event || "").toUpperCase();
    const participant = payload.participant || {};
    const userId = participant.id || participant.userId;

    if (!userId) {
      return NextResponse.json({
        success: true,
        message: "Ignored anonymous participant",
        data: { ignored: true },
      });
    }

    const roles = participant.role ? [participant.role] : ["student"];

    let mappedEvent: "joined" | "left" | "heartbeat" = "heartbeat";
    if (eventType.includes("JOIN")) mappedEvent = "joined";
    else if (eventType.includes("LEAV") || eventType.includes("LEFT")) mappedEvent = "left";
    let result;
    if (isDemoSession) {
      result = await DemoParticipationService.recordParticipation(
        userId,
        roles,
        classId,
        {
          event: mappedEvent,
          studentId: participant.studentId,
          durationSeconds: payload.durationSeconds || 0,
          eventId: payload.event_id || `${userId}-${eventType}-${payload.timestamp || Date.now()}`,
          timestamp: payload.timestamp ? new Date(payload.timestamp * 1000) : new Date(),
        }
      );
    } else {
      const liveClass = await LiveClass.findById(classId);
      if (!liveClass) {
        return NextResponse.json(
          { success: false, error: "LiveClass not found for room" },
          { status: 404 }
        );
      }
      
      result = await ParticipationService.recordParticipation(
        userId,
        roles,
        classId,
        {
          event: mappedEvent,
          studentId: participant.studentId,
          durationSeconds: payload.durationSeconds || 60,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Jitsi webhook processed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error in Jitsi webhook endpoint:", error);
    const status = error.statusCode || error.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process Jitsi webhook",
      },
      { status }
    );
  }
}
