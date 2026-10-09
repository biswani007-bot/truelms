import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../config/db";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { verifyAuth } from "../../../../middleware/auth.middleware";
import { ApiError } from "../../../../utils/api-error";
import { ERROR_CODES } from "../../../../constants/error-codes";
import { User } from "../../../../models/user.model";

export const PUT = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== "Parent") {
    throw new ApiError(403, "Forbidden", ERROR_CODES.FORBIDDEN);
  }

  const body = await req.json();
  const { timezone } = body;

  if (!timezone) {
    throw new ApiError(400, "timezone is required", ERROR_CODES.VALIDATION_ERROR);
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch (error) {
    throw new ApiError(400, "Invalid timezone", ERROR_CODES.VALIDATION_ERROR);
  }

  await User.findByIdAndUpdate(authUser.userId, { timezone });

  return NextResponse.json(
    ResponseHelper.success("Timezone updated successfully", { timezone }),
    { status: 200 }
  );
});
