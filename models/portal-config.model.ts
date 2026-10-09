import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IPortalConfig extends IBaseDocument {
  portalId: string; // 'student-portal' | 'teacher-portal' | 'parent-portal' | 'flutter-app' | 'alumni-portal' | 'employer-portal'
  name: string;
  type: "web" | "mobile" | "hybrid";
  status: "active" | "maintenance" | "disabled" | "beta";
  version: string;
  minVersionRequired: string;
  forceUpdate: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: string;
  
  // Auth Governance
  authSettings: {
    emailLogin: boolean;
    googleLogin: boolean;
    microsoftLogin: boolean;
    appleLogin: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChar: boolean;
      requireUppercase: boolean;
      requireNumbers: boolean;
    };
    mfaRequired: boolean;
    sessionTimeoutSeconds: number;
    maxConcurrentSessions: number;
    deviceLimit: number;
    rememberMeEnabled: boolean;
    invitationPolicy: "open" | "invite-only" | "admin-approval";
  };

  // Feature Flags
  featureFlags: Record<string, boolean>;

  // Notification Governance
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    whatsappEnabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };

  // Branding & Theme Overrides
  branding: {
    portalName: string;
    logoUrl?: string;
    darkLogoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    defaultTheme: "light" | "dark" | "system";
    supportEmail: string;
    supportPhone: string;
    customFooterText?: string;
  };

  // Legal & Consent
  consentSettings: {
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    cookiePolicyUrl: string;
    consentVersion: string;
    parentalConsentRequired: boolean;
    marketingConsentEnabled: boolean;
  };

  // Mobile App Governance
  mobileConfig: {
    deepLinkingEnabled: boolean;
    appStoreUrl?: string;
    playStoreUrl?: string;
    bundleId?: string;
  };

  // Security Governance
  security: {
    rateLimitRequestsPerMin: number;
    trustedDomains: string[];
    allowedDevices: string[];
    jwtLifetimeMinutes: number;
    refreshLifetimeDays: number;
  };
}

const PortalConfigSchema = new Schema(
  {
    portalId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["web", "mobile", "hybrid"], default: "web" },
    status: { type: String, enum: ["active", "maintenance", "disabled", "beta"], default: "active", index: true },
    version: { type: String, required: true, default: "1.0.0" },
    minVersionRequired: { type: String, default: "1.0.0" },
    forceUpdate: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "This portal is currently under scheduled maintenance." },
    maintenanceEndTime: { type: String },

    authSettings: {
      emailLogin: { type: Boolean, default: true },
      googleLogin: { type: Boolean, default: true },
      microsoftLogin: { type: Boolean, default: false },
      appleLogin: { type: Boolean, default: false },
      passwordPolicy: {
        minLength: { type: Number, default: 8 },
        requireSpecialChar: { type: Boolean, default: true },
        requireUppercase: { type: Boolean, default: true },
        requireNumbers: { type: Boolean, default: true },
      },
      mfaRequired: { type: Boolean, default: false },
      sessionTimeoutSeconds: { type: Number, default: 3600 },
      maxConcurrentSessions: { type: Number, default: 3 },
      deviceLimit: { type: Number, default: 5 },
      rememberMeEnabled: { type: Boolean, default: true },
      invitationPolicy: { type: String, enum: ["open", "invite-only", "admin-approval"], default: "invite-only" },
    },

    featureFlags: { type: Schema.Types.Mixed, default: {} },

    notificationSettings: {
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      pushEnabled: { type: Boolean, default: true },
      inAppEnabled: { type: Boolean, default: true },
      whatsappEnabled: { type: Boolean, default: false },
      quietHoursStart: { type: String, default: "22:00" },
      quietHoursEnd: { type: String, default: "07:00" },
    },

    branding: {
      portalName: { type: String, required: true },
      logoUrl: { type: String, default: "" },
      darkLogoUrl: { type: String, default: "" },
      faviconUrl: { type: String, default: "" },
      primaryColor: { type: String, default: "#4f46e5" },
      secondaryColor: { type: String, default: "#06b6d4" },
      accentColor: { type: String, default: "#8b5cf6" },
      defaultTheme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      supportEmail: { type: String, default: "support@lmsca.com" },
      supportPhone: { type: String, default: "+1-800-555-LMSC" },
      customFooterText: { type: String, default: "Powered by LMSCA Enterprise Platform Governance Engine" },
    },

    consentSettings: {
      privacyPolicyUrl: { type: String, default: "/privacy" },
      termsOfServiceUrl: { type: String, default: "/terms" },
      cookiePolicyUrl: { type: String, default: "/cookies" },
      consentVersion: { type: String, default: "2026.1" },
      parentalConsentRequired: { type: Boolean, default: true },
      marketingConsentEnabled: { type: Boolean, default: false },
    },

    mobileConfig: {
      deepLinkingEnabled: { type: Boolean, default: true },
      appStoreUrl: { type: String, default: "" },
      playStoreUrl: { type: String, default: "" },
      bundleId: { type: String, default: "com.lmsca.app" },
    },

    security: {
      rateLimitRequestsPerMin: { type: Number, default: 120 },
      trustedDomains: [{ type: String }],
      allowedDevices: [{ type: String }],
      jwtLifetimeMinutes: { type: Number, default: 15 },
      refreshLifetimeDays: { type: Number, default: 7 },
    },
  },
  { timestamps: true }
);

PortalConfigSchema.plugin(baseModelPlugin);

export const PortalConfig =
  mongoose.models.PortalConfig || mongoose.model<IPortalConfig>("PortalConfig", PortalConfigSchema);
