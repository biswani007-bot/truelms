/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";
import { RosterEligibilityService } from "../../../../../../services/batch/roster-eligibility.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function resolveBatchId(req: NextRequest, ctx1?: any, ctx2?: any): Promise<string | undefined> {
  const p2 = ctx2?.params;
  if (p2) {
    const resolved = typeof p2.then === "function" ? await p2 : p2;
    if (resolved?.id) return resolved.id;
  }
  const p1 = ctx1?.params;
  if (p1) {
    const resolved = typeof p1.then === "function" ? await p1 : p1;
    if (resolved?.id) return resolved.id;
  }
  const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;
  const match = pathname.match(/\/batches\/([^/]+)/);
  return match ? match[1] : undefined;
}

export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const id = await resolveBatchId(req, _ctx, routeCtx);

    if (!id) {
      return NextResponse.json(ResponseHelper.error("Batch ID required"), { status: 400 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;

    const result = await RosterEligibilityService.getEligibleStudentsForBatch(id, search);
    if (!result) {
      return NextResponse.json(
        ResponseHelper.error("Batch not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ResponseHelper.success("Fetched eligible students successfully", result.eligibleStudents),
      { status: 200 }
    );
  })
);
