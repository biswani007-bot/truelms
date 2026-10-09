
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/users
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
import { connectDB } from "../../../../config/db";
import { userRepository } from "../../../../repositories/user.repository";

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Support basic pagination from query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const users = await userRepository.paginate(
      { page, limit, sort: "createdAt", order: "desc", filters: {} },
      ["firstName", "lastName", "email", "phone"]
    );
    
    return NextResponse.json({ success: true, ...users });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { PasswordHelper } from "../../../../helpers/password";
import { Teacher } from "../../../../models/teacher.model";
import { Student } from "../../../../models/student.model";
import { Parent } from "../../../../models/parent.model";
import { Role } from "../../../../models/role.model";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { firstName, lastName, email, phone, role, timezone, language, password } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await PasswordHelper.hash(password);

    const newUser = await userRepository.create({
      firstName,
      lastName,
      email,
      role,
      password: hashedPassword,
      isActive: true,
    } as any);

    const userObj = typeof newUser.toObject === "function" ? newUser.toObject() : JSON.parse(JSON.stringify(newUser));
    delete userObj.password;

    // Auto-provision profile based on role
    const roleDoc = await Role.findById(role);
    if (roleDoc) {
      if (roleDoc.name === "Teacher") {
        const teacherCount = await Teacher.countDocuments();
        await Teacher.create({
          user: newUser._id,
          employeeId: `EMP-${String(teacherCount + 1).padStart(4, "0")}`,
          teacherCode: `TCH-${String(teacherCount + 1).padStart(4, "0")}`,
          firstName,
          lastName,
          gender: "Not Specified",
          dob: new Date("1990-01-01"),
          phone: phone || "0000000000",
          address: "TBD",
          city: "TBD",
          state: "TBD",
          postalCode: "000000",
          nationality: "TBD",
          designation: "Instructor",
          department: "General",
          joiningDate: new Date(),
          employmentType: "full-time",
          status: "active",
        });
      } else if (roleDoc.name === "Student") {
        const studentCount = await Student.countDocuments();
        await Student.create({
          user: newUser._id,
          studentId: `STU-${String(studentCount + 1).padStart(5, "0")}`,
          studentCode: `STD-${String(studentCount + 1).padStart(5, "0")}`,
          firstName,
          lastName,
          gender: "Not Specified",
          dob: new Date("2010-01-01"),
          phone: phone || "0000000000",
          address: "TBD",
          city: "TBD",
          state: "TBD",
          postalCode: "000000",
          bloodGroup: "O+",
          enrollmentDate: new Date(),
          status: "active",
        });
      } else if (roleDoc.name === "Parent") {
        const parentCount = await Parent.countDocuments();
        await Parent.create({
          user: newUser._id,
          parentId: `PAR-${String(parentCount + 1).padStart(5, "0")}`,
          firstName,
          lastName,
          email,
          phone: phone || "0000000000",
          address: "TBD",
          city: "TBD",
          state: "TBD",
          country: "India",
          postalCode: "000000",
          languagePreference: language || "en",
          status: "active",
        });
      }
    }

    return NextResponse.json({ success: true, data: userObj }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
