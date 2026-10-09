import jwt from "jsonwebtoken";

export interface JitsiUserContext {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isModerator: boolean;
  studentId?: string;
}

export interface JitsiTokenPayload {
  token: string;
  roomName: string;
  jitsiDomain: string;
  serverUrl: string;
  isModerator: boolean;
  expiresAt: number;
}

/**
 * Deterministically constructs a secure opaque room name from the LiveClass ID.
 */
export function getJitsiRoomName(liveClassId: string): string {
  return `truelern-${liveClassId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/**
 * Server-side Jitsi JWT generator implementing official Jitsi Token Authentication.
 * Never exposes JITSI_APP_SECRET to the client.
 */
export function generateJitsiToken(
  liveClassId: string,
  user: JitsiUserContext
): JitsiTokenPayload {
  const appId = process.env.JITSI_APP_ID || "truelern-lms";
  const appSecret =
    process.env.JITSI_APP_SECRET || "truelern_secure_jitsi_jwt_secret_key_2026";
  const domain = process.env.JITSI_DOMAIN || "localhost:8443";
  const serverUrl = process.env.JITSI_SERVER_URL || `https://${domain}`;

  const roomName = getJitsiRoomName(liveClassId);
  const nowInSec = Math.floor(Date.now() / 1000);
  const expiresAt = nowInSec + 2 * 60 * 60; // 2 hours validity

  const payload = {
    iss: appId,
    aud: "jitsi",
    sub: domain,
    room: roomName,
    nbf: nowInSec - 10,
    exp: expiresAt,
    context: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        affiliation: user.isModerator ? "owner" : "member",
        moderator: user.isModerator ? "true" : "false",
        role: user.isModerator ? "moderator" : (user.studentId ? "student" : "participant"),
        studentId: user.studentId || "",
      },
      features: {
        recording: user.isModerator,
        livestreaming: false,
        "screen-sharing": true,
      },
    },
  };

  const token = jwt.sign(payload, appSecret, { algorithm: "HS256" });

  return {
    token,
    roomName,
    jitsiDomain: domain,
    serverUrl,
    isModerator: user.isModerator,
    expiresAt,
  };
}
