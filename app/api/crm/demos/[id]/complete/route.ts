import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withRoles } from "@/middleware/auth.middleware";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";
import { ResponseHelper } from "@/helpers/response";
import { DemoCompletionService } from "@/services/demo/demo-completion.service";

/**
 * POST /api/crm/demos/[id]/complete
 * Authoritatively marks a DemoSession as completed.
 * Accessible to authorized admissions counsellors and administrators.
 */
export const POST = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor", "Academic Manager", "operations-manager", "Marketing Manager"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(ResponseHelper.error("Invalid Demo ID"), { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const result = await DemoCompletionService.completeDemoSession(
      id,
      authUser.userId || authUser.id || "",
      {
        reason: body.reason || "Explicitly marked completed by CRM counsellor/admin",
      }
    );

    return NextResponse.json(
      ResponseHelper.success("Demo session completed successfully", result.demo),
      { status: 200 }
    );
  })
);
