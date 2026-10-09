import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (!clientId || !tenantId) {
    return NextResponse.redirect(`${appUrl}/login?error=Configuration_Error`);
  }

  const state = crypto.randomBytes(32).toString("hex");
  const redirectUri = `${appUrl}/api/auth/callback/microsoft`;
  
  const microsoftAuthUrl = new URL(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize`);
  microsoftAuthUrl.searchParams.set("client_id", clientId);
  microsoftAuthUrl.searchParams.set("redirect_uri", redirectUri);
  microsoftAuthUrl.searchParams.set("response_type", "code");
  microsoftAuthUrl.searchParams.set("scope", "openid profile email User.Read");
  microsoftAuthUrl.searchParams.set("state", state);
  microsoftAuthUrl.searchParams.set("response_mode", "query");

  const response = NextResponse.redirect(microsoftAuthUrl.toString());
  
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60, // 10 mins
  });

  return response;
}
