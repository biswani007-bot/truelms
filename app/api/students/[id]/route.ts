/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Retrieve student details
 *     tags: [students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 *   put:
 *     summary: Update student profile details
 *     tags: [students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Student not found
 *   delete:
 *     summary: Soft delete student profile
 *     tags: [students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile archived successfully
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { studentRepository } from "../../../../repositories/student.repository";
import { studentTimelineRepository } from "../../../../repositories/student-timeline.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { User } from "../../../../models/user.model";

// GET Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Read Only"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const student = await studentRepository.findById(id, { populate: "user" });
    if (!student) {
      return NextResponse.json(ResponseHelper.error("Student profile not found", "NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Fetched student details", student), { status: 200 });
  })
);

// PUT Update
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const oldStudent = await studentRepository.findById(id);
    if (!oldStudent) {
      return NextResponse.json(ResponseHelper.error("Student profile not found", "NOT_FOUND"), { status: 404 });
    }

    // Role-based authorization check: A student can only edit their own profile
    const roleName = authUser?.role?.name || authUser?.roleName || "";
    if (roleName.toLowerCase() === "student") {
      if (!oldStudent.user || oldStudent.user.toString() !== authUser._id.toString()) {
        return NextResponse.json(
          ResponseHelper.error("Access denied: You cannot modify another student's profile", "FORBIDDEN"),
          { status: 403 }
        );
      }
    }

    const allowedUpdates: Record<string, any> = {};

    // First & Last Name validation
    if (body.firstName !== undefined) {
      if (!body.firstName.trim()) {
        return NextResponse.json(ResponseHelper.error("First Name cannot be empty", "VALIDATION_ERROR"), { status: 400 });
      }
      allowedUpdates.firstName = body.firstName.trim();
    }

    if (body.middleName !== undefined) {
      allowedUpdates.middleName = body.middleName.trim();
    }

    if (body.lastName !== undefined) {
      if (!body.lastName.trim()) {
        return NextResponse.json(ResponseHelper.error("Last Name cannot be empty", "VALIDATION_ERROR"), { status: 400 });
      }
      allowedUpdates.lastName = body.lastName.trim();
    }

    // Date of Birth validation
    if (body.dob !== undefined) {
      if (body.dob) {
        const parsedDob = new Date(body.dob);
        if (isNaN(parsedDob.getTime())) {
          return NextResponse.json(ResponseHelper.error("Invalid Date of Birth", "VALIDATION_ERROR"), { status: 400 });
        }
        if (parsedDob > new Date()) {
          return NextResponse.json(ResponseHelper.error("Date of Birth cannot be in the future", "VALIDATION_ERROR"), { status: 400 });
        }
        allowedUpdates.dob = parsedDob;
      } else {
        allowedUpdates.dob = null;
      }
    }

    // Gender
    if (body.gender !== undefined) {
      const g = (body.gender || "").toLowerCase().trim();
      if (["male", "female", "other", "prefer-not-to-say"].includes(g)) {
        allowedUpdates.gender = g;
      }
    }

    // Contact & Location
    if (body.phone !== undefined) allowedUpdates.phone = body.phone.trim();
    if (body.alternatePhone !== undefined) allowedUpdates.alternatePhone = body.alternatePhone.trim();
    if (body.emergencyContact !== undefined) allowedUpdates.emergencyContact = body.emergencyContact.trim();
    if (body.city !== undefined) allowedUpdates.city = body.city.trim();
    if (body.state !== undefined) allowedUpdates.state = body.state.trim();
    if (body.country !== undefined) allowedUpdates.country = body.country.trim();
    if (body.postalCode !== undefined) allowedUpdates.postalCode = body.postalCode.trim();

    // Education
    if (body.highestQualification !== undefined) allowedUpdates.highestQualification = body.highestQualification.trim();
    if (body.schoolCollege !== undefined) allowedUpdates.schoolCollege = body.schoolCollege.trim();
    if (body.passingYear !== undefined) allowedUpdates.passingYear = Number(body.passingYear);
    if (body.cgpaPercentage !== undefined) allowedUpdates.cgpaPercentage = Number(body.cgpaPercentage);

    // Status: only admins/counsellors may alter status
    if (body.status !== undefined && roleName.toLowerCase() !== "student") {
      allowedUpdates.status = body.status;
    }

    if (body.preferences !== undefined) {
      allowedUpdates.preferences = body.preferences;
    }

    const updated = await studentRepository.update(id, allowedUpdates);
    if (!updated) {
      return NextResponse.json(ResponseHelper.error("Failed to update student profile", "NOT_FOUND"), { status: 404 });
    }

    // Keep Student User profile synchronized if linked (NEVER touches parent account)
    if (oldStudent.user && (allowedUpdates.firstName || allowedUpdates.lastName)) {
      await User.findByIdAndUpdate(oldStudent.user, {
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
    }


    // Timeline audit logging
    if (body.status && body.status !== oldStudent.status) {
      await studentTimelineRepository.create({
        student: id,
        event: "status_change",
        description: `Student status updated from ${oldStudent.status} to ${body.status} by ${authUser.email || "staff"}`,
      });
    } else {
      await studentTimelineRepository.create({
        student: id,
        event: "profile_updated",
        description: `Student profile updated by ${authUser.email || "staff"}`,
      });
    }

    return NextResponse.json(ResponseHelper.success("Student profile details updated", updated), { status: 200 });
  })
);

// DELETE Soft Delete
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const result = await studentRepository.softDelete(id);
    return NextResponse.json(ResponseHelper.success("Student profile archived successfully", result), { status: 200 });
  })
);
