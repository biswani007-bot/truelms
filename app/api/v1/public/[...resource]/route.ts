
/**
 * @swagger
 * /api/v1/public/{...resource}:
 *   get:
 *     summary: Auto-generated summary for GET /api/v1/public/{...resource}
 *     tags: [v1]
 *     
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { ApiKeyService } from "../../../../../services/gateway/api-key.service";
import { RateLimitService } from "../../../../../services/gateway/rate-limit.service";
import { ApiAuditService } from "../../../../../services/gateway/api-audit.service";
import { ApiGatewayService } from "../../../../../services/gateway/api-gateway.service";
import { ApiUsage } from "../../../../../models/api-usage.model";

interface RouteParams {
  params: Promise<{ resource: string[] }>;
}

export const GET = apiHandler(async (req: NextRequest, _ctx: unknown, routeCtx: RouteParams) => {
  const startTime = Date.now();
  await connectDB();

  const { resource } = await routeCtx.params;
  const resourceName = resource[0];

  const keyId = req.headers.get("x-api-key") || "";
  const secret = req.headers.get("x-api-secret") || "";
  const ipAddress = req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || undefined;
  const actionPath = `GET /api/v1/public/${resource.join("/")}`;

  // 1. Key Authentication
  const key = await ApiKeyService.authenticate(keyId, secret, ipAddress);
  if (!key) {
    await ApiAuditService.logAccess({
      ipAddress,
      userAgent,
      action: actionPath,
      status: "unauthorized",
    });
    return NextResponse.json(ResponseHelper.error("Unauthorized: Invalid API Key or Secret"), { status: 401 });
  }

  // 2. Rate Limiting
  const isLimited = RateLimitService.isRateLimited(keyId);
  if (isLimited) {
    await ApiAuditService.logAccess({
      apiKeyId: key._id.toString(),
      ipAddress,
      userAgent,
      action: actionPath,
      status: "rate-limited",
    });
    return NextResponse.json(ResponseHelper.error("Too Many Requests: Rate limit exceeded"), { status: 429 });
  }

  // 3. Scope validation
  const requiredScope = `read:${resourceName}`;
  const hasScope = key.scopes.includes(requiredScope) || key.scopes.includes("*");
  if (!hasScope) {
    await ApiAuditService.logAccess({
      apiKeyId: key._id.toString(),
      ipAddress,
      userAgent,
      action: actionPath,
      status: "forbidden-scope",
    });
    return NextResponse.json(ResponseHelper.error(`Forbidden: Missing required scope: ${requiredScope}`), { status: 403 });
  }

  try {
    // 4. Resolve Route using internal services pagination
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const data = await ApiGatewayService.resolvePublicRoute(resourceName, {
      ...searchParams,
      method: "GET",
    });

    // 5. Audit Logging & Usage telemetry metrics
    await ApiAuditService.logAccess({
      apiKeyId: key._id.toString(),
      ipAddress,
      userAgent,
      action: actionPath,
      status: "success",
    });

    await ApiUsage.create({
      apiClient: key.apiClient,
      apiKey: key._id,
      path: req.nextUrl.pathname,
      method: "GET",
      statusCode: 200,
      durationMs: Date.now() - startTime,
      version: "v1",
    });

    return NextResponse.json(ResponseHelper.success("Resource fetched successfully", data));
  } catch (err: any) {
    await ApiUsage.create({
      apiClient: key.apiClient,
      apiKey: key._id,
      path: req.nextUrl.pathname,
      method: "GET",
      statusCode: 500,
      durationMs: Date.now() - startTime,
      version: "v1",
    });

    return NextResponse.json(ResponseHelper.error(err.message || "Failed to process request"), { status: 500 });
  }
});
