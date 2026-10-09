import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ISettings extends IBaseDocument {
  key: string;
  org: {
    orgName: string;
    legalName: string;
    logo: string;
    darkLogo: string;
    favicon: string;
    supportEmail: string;
    supportPhone: string;
    website: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    typography: string;
    defaultTheme: "light" | "dark" | "system";
    emailBranding: string;
    invoiceBranding: string;
    certificateBranding: string;
  };
  academic: {
    defaultCourseStatus: "DRAFT" | "ACTIVE" | "ARCHIVED";
    enrollmentPolicy: string;
    certificatePolicy: string;
    passingPercentage: number;
    attendanceRequirement: number;
    courseVisibility: "PUBLIC" | "PRIVATE";
    defaultInstructorAssignment: string;
  };
  certificate?: {
    attendanceThreshold: number;
    assignmentSubmissionThreshold: number;
    quizPassingThreshold: number;
    syllabusCompletionRequired: boolean;
  };
  batch: {
    defaultCapacity: number;
    maxCapacity: number;
    waitingListEnabled: boolean;
    autoAllocationEnabled: boolean;
    transferRules: string;
    cancellationRules: string;
    enrollmentWindowDays: number;
    futureCohortRules: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    reminderIntervals: number[];
    digestSettings: string;
  };
  parentPortal: {
    attendanceVisibility: boolean;
    homeworkVisibility: boolean;
    assessmentVisibility: boolean;
    gradeVisibility: boolean;
    feeVisibility: boolean;
    paymentVisibility: boolean;
    certificatesVisibility: boolean;
    timetableVisibility: boolean;
    calendarVisibility: boolean;
    announcementsVisibility: boolean;
    teacherMessagingEnabled: boolean;
    leaveRequestsEnabled: boolean;
    pushNotificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;
    smsNotificationsEnabled: boolean;
    downloadPermissions: boolean;
    reportCardPermissions: boolean;
    documentPermissions: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    senderName: string;
    senderEmail: string;
    replyTo: string;
    templates: string;
  };
  security: {
    sessionTimeout: number; // in seconds
    passwordPolicy: {
      minLength: number;
      requireSpecialChar: boolean;
      requireUppercase: boolean;
    };
    loginAttempts: number;
    accountLockDuration: number; // in minutes
    otpSettings: {
      enabled: boolean;
      expirySeconds: number;
    };
    refreshTokenExpiryDays: number;
    jwtExpiryMinutes: number;
  };
  payment: {
    currency: string;
    taxPercentage: number;
    invoicePrefix: string;
    receiptPrefix: string;
    paymentTerms: string;
    refundPolicyText: string;
    enabledPaymentMethods: string[];
    mode: "test" | "live";
    gateways: {
      provider: string;
      enabled: boolean;
      mode: "test" | "live";
      publicKey: string;
      secretKey: string;
    }[];
  };
  storage: {
    r2Bucket: string;
    r2AccountId: string;
    r2AccessKeyId: string;
    r2SecretAccessKey: string;
    allowedFileTypes: string[];
    maxUploadSizeMb: number;
    imageOptimizationEnabled: boolean;
  };
  localization: {
    timezone: string;
    currency: string;
    language: string;
    dateFormat: string;
    numberFormat: string;
  };
  platform: {
    featureFlags: {
      AUTHENTICATION: boolean;
      CRM: boolean;
      CMS: boolean;
      STUDENTS: boolean;
      TEACHERS: boolean;
      COURSES: boolean;
      LIVE_CLASSES: boolean;
      ASSIGNMENTS: boolean;
      ASSESSMENTS: boolean;
      PAYMENTS: boolean;
      REPORTS: boolean;
      BATCH_ENGINE: boolean;
      BACK_OFFICE: boolean;
      CERTIFICATES: boolean;
      AI_FEATURES: boolean;
    };
  };
  preferences: {
    registrationEnabled: boolean;
    publicCourseVisibility: boolean;
    debugMode: boolean;
    apiRateLimits: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    estimatedEndTime: string;
    whitelistedIps: string[];
  };
  audit: {
    enabled: boolean;
    logLevels: string[];
    retainDays: number;
  };
}

const SettingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global",
      index: true,
    },
    org: {
      orgName: { type: String, required: true, default: "LMSCA Platform" },
      legalName: { type: String, required: true, default: "LMSCA Education Inc." },
      logo: { type: String, required: false, default: "" },
      darkLogo: { type: String, required: false, default: "" },
      favicon: { type: String, required: false, default: "" },
      supportEmail: { type: String, required: true, default: "support@lmsca.com" },
      supportPhone: { type: String, required: true, default: "+1-555-0199" },
      website: { type: String, required: true, default: "https://lmsca.com" },
      address: { type: String, required: true, default: "100 Pine Street" },
      city: { type: String, required: true, default: "San Francisco" },
      state: { type: String, required: true, default: "CA" },
      country: { type: String, required: true, default: "USA" },
      postalCode: { type: String, required: true, default: "94111" },
    },
    branding: {
      primaryColor: { type: String, required: true, default: "#4f46e5" },
      secondaryColor: { type: String, required: true, default: "#06b6d4" },
      accentColor: { type: String, required: true, default: "#8b5cf6" },
      typography: { type: String, required: true, default: "Inter" },
      defaultTheme: { type: String, required: true, enum: ["light", "dark", "system"], default: "dark" },
      emailBranding: { type: String, required: false, default: "" },
      invoiceBranding: { type: String, required: false, default: "" },
      certificateBranding: { type: String, required: false, default: "" },
    },
    academic: {
      defaultCourseStatus: { type: String, required: true, enum: ["DRAFT", "ACTIVE", "ARCHIVED"], default: "DRAFT" },
      enrollmentPolicy: { type: String, required: true, default: "open" },
      certificatePolicy: { type: String, required: true, default: "standard" },
      passingPercentage: { type: Number, required: true, default: 80 },
      attendanceRequirement: { type: Number, required: true, default: 75 },
      courseVisibility: { type: String, required: true, enum: ["PUBLIC", "PRIVATE"], default: "PUBLIC" },
      defaultInstructorAssignment: { type: String, required: false, default: "" },
    },
    certificate: {
      attendanceThreshold: { type: Number, required: true, default: 80, min: 0, max: 100 },
      assignmentSubmissionThreshold: { type: Number, required: true, default: 75, min: 0, max: 100 },
      quizPassingThreshold: { type: Number, required: true, default: 60, min: 0, max: 100 },
      syllabusCompletionRequired: { type: Boolean, required: true, default: true },
    },
    batch: {
      defaultCapacity: { type: Number, required: true, default: 50 },
      maxCapacity: { type: Number, required: true, default: 100 },
      waitingListEnabled: { type: Boolean, required: true, default: true },
      autoAllocationEnabled: { type: Boolean, required: true, default: true },
      transferRules: { type: String, required: false, default: "flexible" },
      cancellationRules: { type: String, required: false, default: "standard" },
      enrollmentWindowDays: { type: Number, required: true, default: 14 },
      futureCohortRules: { type: String, required: false, default: "" },
    },
    notifications: {
      emailEnabled: { type: Boolean, required: true, default: true },
      smsEnabled: { type: Boolean, required: true, default: false },
      pushEnabled: { type: Boolean, required: true, default: false },
      inAppEnabled: { type: Boolean, required: true, default: true },
      reminderIntervals: [{ type: Number }],
      digestSettings: { type: String, required: false, default: "daily" },
    },
    parentPortal: {
      attendanceVisibility: { type: Boolean, default: true },
      homeworkVisibility: { type: Boolean, default: true },
      assessmentVisibility: { type: Boolean, default: true },
      gradeVisibility: { type: Boolean, default: true },
      feeVisibility: { type: Boolean, default: true },
      paymentVisibility: { type: Boolean, default: true },
      certificatesVisibility: { type: Boolean, default: true },
      timetableVisibility: { type: Boolean, default: true },
      calendarVisibility: { type: Boolean, default: true },
      announcementsVisibility: { type: Boolean, default: true },
      teacherMessagingEnabled: { type: Boolean, default: true },
      leaveRequestsEnabled: { type: Boolean, default: true },
      pushNotificationsEnabled: { type: Boolean, default: true },
      emailNotificationsEnabled: { type: Boolean, default: true },
      smsNotificationsEnabled: { type: Boolean, default: false },
      downloadPermissions: { type: Boolean, default: true },
      reportCardPermissions: { type: Boolean, default: true },
      documentPermissions: { type: Boolean, default: true },
    },
    email: {
      smtpHost: { type: String, required: true, default: "smtp.mailgun.org" },
      smtpPort: { type: Number, required: true, default: 587 },
      smtpUser: { type: String, required: false, default: "" },
      smtpPass: { type: String, required: false, default: "" },
      senderName: { type: String, required: true, default: "LMSCA Admissions" },
      senderEmail: { type: String, required: true, default: "admissions@lmsca.com" },
      replyTo: { type: String, required: true, default: "support@lmsca.com" },
      templates: { type: String, required: false, default: "" },
    },
    security: {
      sessionTimeout: { type: Number, required: true, default: 3600 },
      passwordPolicy: {
        minLength: { type: Number, required: true, default: 8 },
        requireSpecialChar: { type: Boolean, required: true, default: true },
        requireUppercase: { type: Boolean, required: true, default: true },
      },
      loginAttempts: { type: Number, required: true, default: 5 },
      accountLockDuration: { type: Number, required: true, default: 15 },
      otpSettings: {
        enabled: { type: Boolean, required: true, default: false },
        expirySeconds: { type: Number, required: true, default: 300 },
      },
      refreshTokenExpiryDays: { type: Number, required: true, default: 7 },
      jwtExpiryMinutes: { type: Number, required: true, default: 15 },
    },
    payment: {
      currency: { type: String, required: true, default: "USD" },
      taxPercentage: { type: Number, required: true, default: 0 },
      invoicePrefix: { type: String, required: true, default: "INV-" },
      receiptPrefix: { type: String, required: true, default: "REC-" },
      paymentTerms: { type: String, required: false, default: "immediate" },
      refundPolicyText: { type: String, required: false, default: "Refundable up to 24h before second lecture." },
      enabledPaymentMethods: [{ type: String, enum: ["cash", "bank-transfer", "upi", "credit-card", "debit-card", "cheque", "online-gateway", "wallet", "custom"] }],
      mode: { type: String, enum: ["test", "live"], required: true, default: "test" },
      gateways: [
        {
          provider: { type: String, required: true },
          enabled: { type: Boolean, required: true, default: false },
          mode: { type: String, enum: ["test", "live"], required: true, default: "test" },
          publicKey: { type: String, required: false, default: "" },
          secretKey: { type: String, required: false, default: "" },
        }
      ],
    },
    storage: {
      r2Bucket: { type: String, required: false, default: "" },
      r2AccountId: { type: String, required: false, default: "" },
      r2AccessKeyId: { type: String, required: false, default: "" },
      r2SecretAccessKey: { type: String, required: false, default: "" },
      allowedFileTypes: [{ type: String }],
      maxUploadSizeMb: { type: Number, required: true, default: 10 },
      imageOptimizationEnabled: { type: Boolean, required: true, default: true },
    },
    localization: {
      timezone: { type: String, required: true, default: "UTC" },
      currency: { type: String, required: true, default: "USD" },
      language: { type: String, required: true, default: "en" },
      dateFormat: { type: String, required: true, default: "YYYY-MM-DD" },
      numberFormat: { type: String, required: true, default: "standard" },
    },
    platform: {
      featureFlags: {
        AUTHENTICATION: { type: Boolean, required: true, default: true },
        CRM: { type: Boolean, required: true, default: true },
        CMS: { type: Boolean, required: true, default: true },
        STUDENTS: { type: Boolean, required: true, default: true },
        TEACHERS: { type: Boolean, required: true, default: true },
        COURSES: { type: Boolean, required: true, default: true },
        LIVE_CLASSES: { type: Boolean, required: true, default: true },
        ASSIGNMENTS: { type: Boolean, required: true, default: true },
        ASSESSMENTS: { type: Boolean, required: true, default: true },
        PAYMENTS: { type: Boolean, required: true, default: true },
        REPORTS: { type: Boolean, required: true, default: true },
        BATCH_ENGINE: { type: Boolean, required: true, default: true },
        BACK_OFFICE: { type: Boolean, required: true, default: true },
        CERTIFICATES: { type: Boolean, required: true, default: true },
        AI_FEATURES: { type: Boolean, required: true, default: false },
      },
    },
    preferences: {
      registrationEnabled: { type: Boolean, required: true, default: true },
      publicCourseVisibility: { type: Boolean, required: true, default: true },
      debugMode: { type: Boolean, required: true, default: false },
      apiRateLimits: { type: Number, required: true, default: 100 },
    },
    maintenance: {
      enabled: { type: Boolean, required: true, default: false },
      message: { type: String, required: false, default: "System is under maintenance. We will be back shortly." },
      estimatedEndTime: { type: String, required: false, default: "" },
      whitelistedIps: [{ type: String }],
    },
    audit: {
      enabled: { type: Boolean, required: true, default: true },
      logLevels: [{ type: String }],
      retainDays: { type: Number, required: true, default: 90 },
    },
  },
  { timestamps: true }
);

SettingsSchema.plugin(baseModelPlugin);

export const Settings =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
