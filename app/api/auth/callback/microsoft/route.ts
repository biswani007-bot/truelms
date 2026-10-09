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
  const errorDescription = req.nextUrl.searchParams.get("error_description");

  const savedState = req.cookies.get("oauth_state")?.value;

  if (error) {
    console.error("Microsoft OAuth Callback Error Parameter:", error, errorDescription);
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${appUrl}/login?error=Invalid_OAuth_State`);
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const redirectUri = `${appUrl}/api/auth/callback/microsoft`;

  if (!clientId || !clientSecret || !tenantId) {
    return NextResponse.redirect(`${appUrl}/login?error=Configuration_Error`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
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
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Microsoft Token Exchange Failed:", tokenData);
      throw new Error("Failed to exchange authorization code for tokens");
    }

    // Decode ID token payload claims safely if present
    let idTokenClaims: Record<string, unknown> = {};
    if (tokenData.id_token && typeof tokenData.id_token === "string") {
      try {
        const parts = tokenData.id_token.split(".");
        if (parts.length >= 2) {
          const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const decodedPayload = Buffer.from(payloadBase64, "base64").toString("utf-8");
          idTokenClaims = JSON.parse(decodedPayload);
        }
      } catch {
        // Fall back to Microsoft Graph claims
      }
    }

    // Fetch verified user info from Microsoft Graph
    const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const msUser = await userRes.json();
    
    // Must have a stable subject identifier (id)
    if (!userRes.ok || !msUser.id) {
      console.error("Microsoft Graph Error:", msUser);
      throw new Error("Failed to verify Microsoft identity");
    }

    const providerSubject: string = msUser.id;

    // Email validation helper rejecting non-addressable #EXT# internal directory UPNs
    const isValidUsableEmail = (val: unknown): val is string => {
      if (typeof val !== "string") return false;
      const trimmed = val.trim();
      if (!trimmed || trimmed.includes("#")) return false;
      return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(trimmed);
    };

    // Prioritized usable email resolution per specification:
    // 1. ID token email claim when present
    // 2. Microsoft Graph mail
    // 3. ID token preferred_username when it is a usable email address
    // 4. Microsoft Graph otherMails where available
    // 5. Microsoft Graph userPrincipalName (when addressable, i.e., not an internal #EXT# UPN)
    const rawEmail =
      (isValidUsableEmail(idTokenClaims.email) ? idTokenClaims.email : null) ||
      (isValidUsableEmail(msUser.mail) ? msUser.mail : null) ||
      (isValidUsableEmail(idTokenClaims.preferred_username) ? idTokenClaims.preferred_username : null) ||
      (Array.isArray(msUser.otherMails) ? msUser.otherMails.find(isValidUsableEmail) : null) ||
      (isValidUsableEmail(msUser.userPrincipalName) ? msUser.userPrincipalName : null);

    if (!rawEmail) {
      throw new Error("No usable verified email address available in Microsoft account");
    }

    const email: string = rawEmail.trim().toLowerCase();
    const emailRegex = new RegExp(`^${email.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&')}$`, 'i');
    
    const firstName: string = msUser.givenName || (typeof idTokenClaims.given_name === "string" ? idTokenClaims.given_name : "") || "Microsoft";
    const lastName: string = msUser.surname || (typeof idTokenClaims.family_name === "string" ? idTokenClaims.family_name : "") || "User";

    // 1. Check for existing UserIdentity linked to this Microsoft subject
    const identity = await userIdentityRepository.findByProviderSubject("microsoft", providerSubject);
    let user;

    if (identity) {
      // Identity already exists — load the linked TrueLern User
      user = await userRepository.findById(identity.user.toString());
      if (!user) throw new Error("Linked TrueLern user account not found");
      if (!user.isActive) throw new Error("Account is deactivated");
    } else {
      // No existing Microsoft identity — attempt email-based resolution
      user = await userRepository.findByEmail(email);

      if (user) {
        if (!user.isActive) throw new Error("Account is deactivated");
        // Existing TrueLern account found — link Microsoft identity to it
        await userIdentityRepository.createIdentity(user._id.toString(), "microsoft", providerSubject);
        
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

        await userIdentityRepository.createIdentity(user._id.toString(), "microsoft", providerSubject);

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

    // Establish TrueLern session using the existing JWT/cookie architecture
    const sessionResult = await authService.oauthLogin(user);

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
    console.error("Microsoft OAuth Callback Error:", errMsg);
    const errResponse = NextResponse.redirect(`${appUrl}/login?error=OAuth_Failed`);
    errResponse.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return errResponse;
  }
}
