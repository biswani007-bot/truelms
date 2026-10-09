import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../config/db";
import { userIdentityRepository } from "../../../../../repositories/user-identity.repository";
import { userRepository } from "../../../../../repositories/user.repository";
import { roleRepository } from "../../../../../repositories/role.repository";
import { authService } from "../../../../../services/auth.service";

export async function GET(req: NextRequest) {
  await connectDB();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const savedState = req.cookies.get("oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${appUrl}/login?error=Invalid_OAuth_State`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=Configuration_Error`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      throw new Error("Failed to exchange authorization code for tokens");
    }

    // Fetch verified user info from Google userinfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    // Must have a stable subject identifier and a verified email
    if (!userRes.ok || !googleUser.sub || !googleUser.email_verified) {
      throw new Error("Failed to verify Google identity or email not verified");
    }

    const providerSubject: string = googleUser.sub as string;
    const email: string = (googleUser.email as string).trim().toLowerCase();
    const emailRegex = new RegExp(`^${email.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&')}$`, 'i');
    const firstName: string = (googleUser.given_name as string) || "Google";
    const lastName: string = (googleUser.family_name as string) || "User";

    // 1. Check for existing UserIdentity linked to this Google subject
    const identity = await userIdentityRepository.findByProviderSubject("google", providerSubject);
    let user;

    if (identity) {
      // Identity already exists — load the linked TrueLern User
      user = await userRepository.findById(identity.user.toString());
      if (!user) throw new Error("Linked TrueLern user account not found");
    } else {
      // No existing Google identity — attempt email-based resolution
      user = await userRepository.findByEmail(email);

      if (user) {
        // Existing TrueLern account found — link Google identity to it
        await userIdentityRepository.createIdentity(user._id.toString(), "google", providerSubject);
        
        // Phase 3G: Ensure Parent domain record exists and is linked
        const { Parent } = await import("../../../../../models/parent.model");
        const parentRecord = await Parent.findOne({ email: emailRegex });
        if (parentRecord) {
          if (!parentRecord.user) {
            parentRecord.user = user._id;
            await parentRecord.save();
          }
          // If this user has an active Parent domain record and is not staff, align User role with Parent
          const currentRoleName = ((user.role as any)?.name || "").toLowerCase();
          if (!["admin", "superadmin", "teacher", "parent"].includes(currentRoleName)) {
            const parentRole = await roleRepository.findRoleByName("Parent") ??
              await roleRepository.findRoleByName("parent") ??
              await roleRepository.findRoleByName("PARENT");
            if (parentRole) {
              await userRepository.update(user._id.toString(), { role: parentRole._id });
              user.role = parentRole;
            }
          }
        }
      } else {
        // No existing account — create a new minimal User with the canonical Parent role
        // Use case-insensitive search to find the canonical Parent role regardless of seeded casing
        const parentRole = await roleRepository.findRoleByName("Parent") ??
          await roleRepository.findRoleByName("parent") ??
          await roleRepository.findRoleByName("PARENT");

        if (!parentRole) {
          throw new Error("Default Parent role not found in database. Contact your administrator.");
        }

        user = await userRepository.create({
          firstName,
          lastName,
          email,
          role: parentRole._id,
          isActive: true,
        } as Partial<import("../../../../../models/user.model").IUser>);
        user.role = parentRole;

        await userIdentityRepository.createIdentity(user._id.toString(), "google", providerSubject);

        // Phase 3G: Ensure Parent domain record exists for the newly provisioned User
        const { Parent } = await import("../../../../../models/parent.model");
        const parentRecord = await Parent.findOne({ email: emailRegex });
        if (parentRecord) {
          if (!parentRecord.user) {
            parentRecord.user = user._id;
            await parentRecord.save();
          }
        } else {
          const parentCount = await Parent.countDocuments();
          const parentId = `PAR-${String(parentCount + 1).padStart(4, "0")}${Date.now().toString().slice(-4)}`;
          await Parent.create({
            user: user._id,
            parentId,
            firstName,
            lastName,
            email,
            phone: "0000000000",
            address: "Pending",
            city: "Pending",
            state: "Pending",
            country: "Pending",
            postalCode: "00000",
            status: "active",
          });
        }
      }
    }

    // Ensure user.role is fully populated with its canonical role document before session generation
    let resolvedRole: { _id?: unknown; name?: string } | null = null;
    const rawRole = user.role as { _id?: unknown; name?: string } | unknown;

    if (rawRole && typeof rawRole === "object" && "name" in rawRole && typeof (rawRole as any).name === "string" && (rawRole as any).name) {
      resolvedRole = rawRole as any;
    } else if (user.role) {
      const roleId = (rawRole && typeof rawRole === "object" && "_id" in rawRole)
        ? String((rawRole as any)._id)
        : String(user.role);
      const roleDoc = await roleRepository.findRoleById(roleId);
      if (roleDoc) {
        resolvedRole = roleDoc;
        user.role = roleDoc as any;
      }
    }

    // Convert to plain object to ensure the populated role is preserved for JWT generation
    const userPayload = typeof user.toObject === "function" ? user.toObject() : user;
    if (resolvedRole) {
      userPayload.role = resolvedRole;
    }

    // Establish TrueLern session using the existing JWT/cookie architecture
    const sessionResult = await authService.oauthLogin(userPayload as any);

    // Determine redirect based on authenticated user's actual role
    const roleName = ((resolvedRole?.name || "").toLowerCase().replace(/[-_ ]/g, ""));
    let redirectUrl = `${appUrl}/student/dashboard`;
    if (["superadmin", "admin", "operationsmanager", "academicmanager", "financemanager"].includes(roleName)) {
      redirectUrl = `${appUrl}/admin`;
    } else if (roleName === "teacher" || roleName === "instructor" || roleName === "faculty") {
      redirectUrl = `${appUrl}/teacher/dashboard`;
    } else if (roleName === "parent" || roleName === "guardian") {
      redirectUrl = `${appUrl}/parent/dashboard`;
    }

    const finalResponse = NextResponse.redirect(redirectUrl);

    // Clear the CSRF state cookie
    finalResponse.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });

    // Set TrueLern session cookies using identical format to the credential login route
    finalResponse.cookies.set("refreshToken", sessionResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60,
    });

    finalResponse.cookies.set("accessToken", sessionResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return finalResponse;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "OAuth authentication failed";
    console.error("Google OAuth Callback Error:", errMsg);
    const errResponse = NextResponse.redirect(`${appUrl}/login?error=OAuth_Failed`);
    errResponse.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return errResponse;
  }
}
