
/**
 * @swagger
 * /api/admin/governance/portals:
 *   put:
 *     summary: Auto-generated summary for PUT /api/admin/governance/portals
 *     tags: [admin]
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

/**
 * @swagger
 * /api/admin/governance/portals:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/governance/portals
 *     tags: [admin]
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
import { connectDB } from "@/lib/db";
import { PortalConfig, PortalAuditLog } from "@/models";
import { authenticateRequest } from "@/middleware/auth.middleware";

const DEFAULT_PORTALS = [
  {
    portalId: "student-portal",
    name: "Student Portal",
    type: "web",
    status: "active",
    version: "1.0.0",
    minVersionRequired: "1.0.0",
    forceUpdate: false,
    branding: { portalName: "TrueLern Student Hub", primaryColor: "#4f46e5", secondaryColor: "#06b6d4" },
    featureFlags: {
      dashboard: true,
      courses: true,
      assignments: true,
      attendance: true,
      grades: true,
      certificates: true,
      payments: true,
      downloads: true,
      calendar: true,
      messages: true,
      notifications: true,
    },
  },
  {
    portalId: "teacher-portal",
    name: "Teacher Portal",
    type: "web",
    status: "active",
    version: "1.0.0",
    minVersionRequired: "1.0.0",
    forceUpdate: false,
    branding: { portalName: "TrueLern Faculty Hub", primaryColor: "#0d9488", secondaryColor: "#3b82f6" },
    featureFlags: {
      dashboard: true,
      attendance: true,
      grading: true,
      assignments: true,
      communication: true,
      reports: true,
      calendar: true,
    },
  },
  {
    portalId: "parent-portal",
    code: "FACULTY_PORTAL",
    name: "Faculty Workspace",
    type: "faculty",
    status: "active",
    enabled: true,
    roles: ["teacher"],
    description: "Course management, gradebook, live session controls, and student communication",
    branding: { portalName: "TrueLern Faculty Hub", primaryColor: "#0d9488", secondaryColor: "#3b82f6" },
  },
  {
    code: "PARENT_PORTAL",
    name: "Guardian Portal",
    type: "parent",
    status: "active",
    enabled: true,
    roles: ["parent"],
    description: "Progress monitoring, attendance tracking, invoices, and faculty messaging",
    branding: { portalName: "TrueLern Family Portal", primaryColor: "#8b5cf6", secondaryColor: "#ec4899" },
  },
  {
    code: "MOBILE_APP",
    name: "Mobile Learning App",
    type: "mobile",
    status: "active",
    enabled: true,
    roles: ["student", "teacher", "parent"],
    description: "Cross-platform mobile application with offline sync and push notifications",
    branding: { portalName: "TrueLern Mobile", primaryColor: "#4f46e5", secondaryColor: "#06b6d4" },
  },
  {
    code: "ALUMNI_NETWORK",
    name: "Alumni Network",
    type: "alumni",
    status: "active",
    enabled: true,
    roles: ["student"],
    description: "Graduate network, job board, mentorship programs, and events",
    branding: { portalName: "TrueLern Alumni Network", primaryColor: "#d97706", secondaryColor: "#b45309" },
  },
  {
    code: "CORPORATE_PORTAL",
    name: "Corporate Partner Portal",
    type: "corporate",
    status: "active",
    enabled: true,
    roles: ["corporate-admin"],
    description: "Enterprise cohort tracking, talent pipeline, and sponsorship metrics",
    branding: { portalName: "TrueLern Corporate Placement", primaryColor: "#2563eb", secondaryColor: "#1d4ed8" },
    featureFlags: {
      candidateSearch: true,
      jobPosting: true,
      interviewScheduler: true,
    },
  },
];

export async function GET(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    let portals = await PortalConfig.find({ isDeleted: { $ne: true } }).lean();

    // Auto-seed default portals if empty
    if (portals.length === 0) {
      await PortalConfig.insertMany(DEFAULT_PORTALS);
      portals = await PortalConfig.find({ isDeleted: { $ne: true } }).lean();
    }

    return NextResponse.json({ success: true, data: portals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch portals" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { portalId, updates, module } = body;

    if (!portalId || !updates) {
      return NextResponse.json({ error: "Portal ID and updates payload required" }, { status: 400 });
    }

    const currentConfig = await PortalConfig.findOne({ portalId });
    if (!currentConfig) {
      return NextResponse.json({ error: "Portal configuration not found" }, { status: 404 });
    }

    // Generate Audit Log records for changed fields
    const auditEntries: any[] = [];
    const flattenedUpdates: Record<string, any> = {};

    function flattenAndCompare(targetObj: any, currentObj: any, prefix = "") {
      for (const key of Object.keys(targetObj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const val = targetObj[key];
        const oldVal = currentObj ? currentObj[key] : undefined;

        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          flattenAndCompare(val, oldVal || {}, fullKey);
        } else {
          flattenedUpdates[fullKey] = val;
          if (JSON.stringify(oldVal) !== JSON.stringify(val)) {
            auditEntries.push({
              portalId,
              adminUser: authResult.user?.userId,
              adminEmail: (authResult.user as any)?.email || "",
              module: module || "directory",
              fieldName: fullKey,
              oldValue: oldVal,
              newValue: val,
            });
          }
        }
      }
    }

    flattenAndCompare(updates, currentConfig.toObject());

    // Apply updates
    Object.assign(currentConfig, updates);
    await currentConfig.save();

    // Write audit logs if any changes occurred
    if (auditEntries.length > 0) {
      await PortalAuditLog.insertMany(auditEntries);
    }

    return NextResponse.json({ success: true, data: currentConfig, auditEntriesCount: auditEntries.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update portal config" }, { status: 500 });
  }
}
