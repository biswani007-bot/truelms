/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { StripeService } from "../../../../../services/finance/stripe.service";
import { connectDB } from "../../../../../config/db";
import { getAuthenticatedParent } from "../../../../../lib/auth/parent-auth";
import { ParentService } from "../../../../../services/parent/parent.service";
import mongoose from "mongoose";

export const POST = withRoles(
  ["Parent", "Student", "Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    
    // amount is deliberately removed from input to enforce server-authoritative calculations
    const { invoiceId, successUrl, cancelUrl, studentId } = await req.json();

    if (!invoiceId || !successUrl || !cancelUrl) {
      return NextResponse.json(ResponseHelper.error("Missing required fields"), { status: 400 });
    }

    // Server-side redirect validation (prevent open redirects)
    const host = req.headers.get("host") || "";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = `${protocol}://${host}`;

    try {
      const parsedSuccess = new URL(successUrl, origin);
      const parsedCancel = new URL(cancelUrl, origin);
      if (parsedSuccess.origin !== origin || parsedCancel.origin !== origin) {
         return NextResponse.json(ResponseHelper.error("Invalid redirect URLs"), { status: 400 });
      }
    } catch {
       return NextResponse.json(ResponseHelper.error("Malformed redirect URLs"), { status: 400 });
    }

    let validStudentId = studentId;

    if (userContext.role === "Student") {
      const { Student } = await import("../../../../../models/student.model");
      const studentRecord = await Student.findOne({ user: userContext.userId });
      if (!studentRecord) return NextResponse.json(ResponseHelper.error("Student profile not found"), { status: 404 });
      validStudentId = studentRecord._id.toString();
    } else if (userContext.role === "Parent") {
      if (!validStudentId) {
        return NextResponse.json(ResponseHelper.error("studentId is required for parents"), { status: 400 });
      }
      const { parent } = await getAuthenticatedParent(req);
      await ParentService.authorizeChildAccess(parent._id as mongoose.Types.ObjectId, validStudentId);
    } else if (["Admin", "Super Admin"].includes(userContext.role)) {
      if (!validStudentId) {
        return NextResponse.json(ResponseHelper.error("studentId is required for admins"), { status: 400 });
      }
    }

    try {
      const session = await StripeService.createCheckoutSession(
        invoiceId,
        validStudentId,
        successUrl,
        cancelUrl
      );

      return NextResponse.json(ResponseHelper.success("Checkout session created", session), { status: 200 });
    } catch (error: any) {
      return NextResponse.json(ResponseHelper.error(error.message), { status: 400 });
    }
  })
);
