import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../config/db";
import { userRepository } from "../../../../../repositories/user.repository";
import { roleRepository } from "../../../../../repositories/role.repository";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { apiHandler } from "../../../../../utils/api-handler";
import { ResponseHelper } from "../../../../../helpers/response";
import { AuditService } from "../../../../../services/audit/audit.service";
import mongoose from "mongoose";

export const GET = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const user = await userRepository.findById(id);
    if (!user) {
      return NextResponse.json(ResponseHelper.error("User not found", "NOT_FOUND"), { status: 404 });
    }

    const userObj = typeof user.toObject === "function" ? user.toObject() : JSON.parse(JSON.stringify(user));
    delete userObj.password;
    
    return NextResponse.json(ResponseHelper.success("User retrieved successfully", userObj), { status: 200 });
  })
);

export const PUT = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const oldUser = await userRepository.findById(id);
    if (!oldUser) {
      return NextResponse.json(ResponseHelper.error("User not found", "NOT_FOUND"), { status: 404 });
    }

    const updateData: any = {};
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.email) updateData.email = body.email.toLowerCase();
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    if (body.role) {
      const roleDoc = await roleRepository.findOne(mongoose.isValidObjectId(body.role) ? { _id: body.role } : { name: body.role });
      if (!roleDoc) {
        return NextResponse.json(ResponseHelper.error("Invalid role", "VALIDATION_ERROR"), { status: 400 });
      }
      updateData.role = roleDoc._id;
    }

    const updatedUser = await userRepository.update(id, updateData, { populate: "role" });
    
    await AuditService.logMutation({
      userId: authUser?.userId,
      role: authUser?.role,
      action: "UserUpdated",
      entity: "User",
      entityId: id,
      metadata: { fieldsUpdated: Object.keys(updateData) }
    });

    const userObj = updatedUser?.toObject ? updatedUser.toObject() : JSON.parse(JSON.stringify(updatedUser));
    delete userObj?.password;

    return NextResponse.json(ResponseHelper.success("User updated successfully", userObj), { status: 200 });
  })
);
