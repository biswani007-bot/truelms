import mongoose from "mongoose";
import "../../models/index";
import { ParentStudentLink } from "../../models/parent-student-link.model";
import { Course } from "../../models/course.model";
import { Attendance } from "../../models/attendance.model";
import { AttendanceSummary } from "../../models/attendance-summary.model";
import { Assignment } from "../../models/assignment.model";
import { AssignmentSubmission } from "../../models/assignment-submission.model";
import { Assessment } from "../../models/assessment.model";
import { AssessmentResult } from "../../models/assessment-result.model";
import { BatchStudent } from "../../models/batch-student.model";
import { LiveClass } from "../../models/live-class.model";
import { LiveClassRecording } from "../../models/live-class-recording.model";
import { Invoice } from "../../models/invoice.model";
import { InvoiceItem } from "../../models/invoice-item.model";
import { Payment } from "../../models/payment.model";
import { Receipt } from "../../models/receipt.model";
import { Notification } from "../../models/notification.model";
import { ApiError } from "../../utils/api-error";
import { ERROR_CODES } from "../../constants/error-codes";
import { Lead } from "../../models/lead.model";
import { Enrollment } from "../../models/enrollment.model";
import { Parent } from "../../models/parent.model";
import { User } from "../../models/user.model";
import { UserIdentity } from "../../models/user-identity.model";
import { DemoSession } from "../../models/demo-session.model";
import { DemoAvailability } from "../../models/demo-availability.model";
import { AssignmentAttachment } from "../../models/assignment-attachment.model";
import { AssignmentEvaluation } from "../../models/assignment-evaluation.model";
import { SubmissionService } from "../assignment/submission.service";
import { PaymentService } from "../finance/payment.service";
import { PaymentAutomationService } from "../automation/payment-automation.service";
import { Teacher } from "../../models/teacher.model";
import { Batch } from "../../models/batch.model";
import { BatchTeacher } from "../../models/batch-teacher.model";
import { ParentTeacherMessage } from "../../models/parent-teacher-message.model";
import { generateReceiptPdfBuffer } from "../../lib/finance/receipt-pdf-generator";
import { generateInvoicePdfBuffer } from "../../lib/finance/invoice-pdf-generator";
import { JobEngineService } from "../jobs/job-engine.service";
import { Certificate } from "../../models/certificate.model";
import { DemoTeacherService } from "../demo/demo-teacher.service";
import { Student } from "../../models/student.model";
import { Role } from "../../models/role.model";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ProgressService } from "../academic/progress.service";
import { calculateAge } from "../../utils/age-helper";
import { FeePlan } from "../../models/fee-plan.model";
import { FinanceCalculationService } from "../finance/finance-calculation.service";
import { CheckoutTokenService } from "../auth/checkout-token.service";

export class ParentService {
  /**
   * CANONICAL CHILD AUTHORIZATION PRIMITIVE
   * Every child-scoped Parent Service method MUST call this guard first.
   * Authorization rule:
   * active Parent + valid ParentStudentLink + canAccessPortal === true
   */
  static async authorizeChildAccess(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    if (!mongoose.isValidObjectId(studentIdStr)) {
      throw new ApiError(400, "Invalid Student ID", ERROR_CODES.VALIDATION_ERROR);
    }
    const studentId = new (mongoose.Types.ObjectId as any)(studentIdStr);

    const link = await ParentStudentLink.findOne({
      parent: parentId,
      student: studentId,
      canAccessPortal: true,
      isDeleted: { $ne: true },
    }).populate("student");

    if (!link || !link.student || (link.student as any).isDeleted) {
      throw new ApiError(
        403,
        "Access denied: You are not authorized to view this student's records",
        ERROR_CODES.FORBIDDEN
      );
    }

    return {
      link,
      student: link.student as any,
    };
  }

  /**
   * Retrieve all children linked to this parent with complete profile info.
   * Deduplicates by unique student ID, preserving the most authoritative valid active ParentStudentLink.
   */
  static async getLinkedChildren(parentId: mongoose.Types.ObjectId) {
    const links = await ParentStudentLink.find({
      parent: parentId,
      canAccessPortal: true,
      isDeleted: { $ne: true },
    })
      .sort({ priority: 1, updatedAt: -1 })
      .populate<{ student: any }>("student");

    const seenStudents = new Set<string>();
    const uniqueChildren: any[] = [];

    for (const l of links) {
      if (!l.student || l.student.isDeleted) continue;
      const studentIdStr = l.student._id.toString();
      if (seenStudents.has(studentIdStr)) continue;
      seenStudents.add(studentIdStr);

      uniqueChildren.push({
        linkId: l._id,
        studentId: l.student._id,
        studentCode: l.student.studentId,
        firstName: l.student.firstName,
        middleName: l.student.middleName || "",
        lastName: l.student.lastName,
        name: [l.student.firstName, l.student.middleName, l.student.lastName].filter(Boolean).join(" "),
        gender: l.student.gender,
        dob: l.student.dob,
        age: calculateAge(l.student.dob),
        phone: l.student.phone,
        city: l.student.city || "",
        state: l.student.state || "",
        country: l.student.country || "",
        schoolCollege: l.student.schoolCollege || "",
        relationshipType: l.relationshipType,
        isCustodial: l.isCustodial,
        isEmergencyContact: l.isEmergencyContact,
        canAccessPortal: l.canAccessPortal,
        status: l.student.status,
      });
    }

    return uniqueChildren;
  }

  /**
   * Adds a new child (Student) and creates an authoritative ParentStudentLink for the authenticated Parent.
   * Ensures idempotency: duplicate requests with identical first, last name AND identical DOB reuse the existing link.
   * Supports legitimate siblings with the same family name and distinct DOBs.
   * Ensures consistency: cleans up any partially created documents on failure.
   */
  static async addChild(
    parentId: mongoose.Types.ObjectId,
    data: {
      firstName: string;
      middleName?: string;
      lastName: string;
      relationshipType?: string;
      gender?: string;
      dob?: string | Date;
      phone?: string;
      city?: string;
      state?: string;
      country?: string;
      schoolCollege?: string;
    }
  ) {
    if (!data.firstName || !data.firstName.trim()) {
      throw new ApiError(400, "First name is required", ERROR_CODES.VALIDATION_ERROR);
    }
    if (!data.lastName || !data.lastName.trim()) {
      throw new ApiError(400, "Last name is required", ERROR_CODES.VALIDATION_ERROR);
    }

    const firstName = data.firstName.trim();
    const middleName = data.middleName?.trim() || "";
    const lastName = data.lastName.trim();

    // Validate relationshipType enum
    const validRelationships = ["father", "mother", "guardian", "foster", "other"];
    let relationshipType: any = (data.relationshipType || "guardian").toLowerCase();
    if (!validRelationships.includes(relationshipType)) {
      relationshipType = "guardian";
    }

    // Validate gender enum
    let gender: string | undefined = undefined;
    if (data.gender) {
      const g = data.gender.toLowerCase().trim();
      if (["male", "female", "other", "prefer-not-to-say"].includes(g)) {
        gender = g;
      }
    }

    // Validate DOB if provided
    let dobDate: Date | undefined = undefined;
    if (data.dob) {
      dobDate = new Date(data.dob);
      if (isNaN(dobDate.getTime())) {
        throw new ApiError(400, "Invalid Date of Birth", ERROR_CODES.VALIDATION_ERROR);
      }
      if (dobDate > new Date()) {
        throw new ApiError(400, "Date of Birth cannot be in the future", ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Verify Parent exists
    const parent = await Parent.findById(parentId);
    if (!parent) {
      throw new ApiError(404, "Parent profile not found", ERROR_CODES.NOT_FOUND);
    }

    // Deduplication check (Phase 1R):
    // Do NOT blindly block same-name siblings.
    // If DOB is provided, match only when firstName, lastName, and identical DOB match.
    // If DOB is not provided, check if a child with same names was created within the last 15 seconds (double-click debounce).
    const existingLinks = await ParentStudentLink.find({
      parent: parentId,
      isDeleted: { $ne: true },
    }).populate<{ student: any }>("student");

    const fifteenSecondsAgo = new Date(Date.now() - 15000);

    const existingMatch = existingLinks.find((l) => {
      if (!l.student || l.student.isDeleted) return false;
      const fnMatch = l.student.firstName?.toLowerCase() === firstName.toLowerCase();
      const lnMatch = l.student.lastName?.toLowerCase() === lastName.toLowerCase();
      if (!fnMatch || !lnMatch) return false;

      // If DOB provided for both, compare dates
      if (dobDate && l.student.dob) {
        const existingDob = new Date(l.student.dob);
        return existingDob.toISOString().slice(0, 10) === dobDate.toISOString().slice(0, 10);
      }

      // If neither has DOB, check if created recently (double-submit debounce)
      const linkCreatedAt = (l as any).createdAt ? new Date((l as any).createdAt) : null;
      if (linkCreatedAt && linkCreatedAt > fifteenSecondsAgo) {
        return true;
      }

      return false;
    });

    if (existingMatch && existingMatch.student) {
      return {
        linkId: existingMatch._id,
        studentId: existingMatch.student._id,
        studentCode: existingMatch.student.studentId,
        firstName: existingMatch.student.firstName,
        middleName: existingMatch.student.middleName || "",
        lastName: existingMatch.student.lastName,
        name: [existingMatch.student.firstName, existingMatch.student.middleName, existingMatch.student.lastName].filter(Boolean).join(" "),
        gender: existingMatch.student.gender,
        dob: existingMatch.student.dob,
        age: calculateAge(existingMatch.student.dob),
        phone: existingMatch.student.phone,
        city: existingMatch.student.city || "",
        state: existingMatch.student.state || "",
        country: existingMatch.student.country || "",
        schoolCollege: existingMatch.student.schoolCollege || "",
        relationshipType: existingMatch.relationshipType,
        isCustodial: existingMatch.isCustodial,
        isEmergencyContact: existingMatch.isEmergencyContact,
        canAccessPortal: existingMatch.canAccessPortal,
        status: existingMatch.student.status,
      };
    }

    // Look up Student Role
    const studentRole = await Role.findOne({ name: { $regex: /^student$/i } });
    if (!studentRole) {
      throw new ApiError(500, "Student role configuration missing", ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    // Generate dedicated Student User account
    const randomHex = crypto.randomBytes(4).toString("hex");
    const timestamp = Date.now().toString().slice(-4);
    const sanitizedFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const sanitizedLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const studentEmail = `${sanitizedFirst || "child"}.${sanitizedLast || "student"}.${timestamp}.${randomHex}@student.truelern.com`;

    const salt = await bcrypt.genSalt(10);
    const tempPasswordHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), salt);

    const user = await User.create({
      firstName,
      lastName,
      email: studentEmail,
      password: tempPasswordHash,
      role: studentRole._id,
      isActive: true,
    });

    // Create Student profile
    const studentCount = await Student.countDocuments();
    const uniqueSuffix = String(studentCount + 1).padStart(4, "0") + Date.now().toString().slice(-4);
    const studentCode = `STU-${uniqueSuffix}`;
    const admissionNumber = `ADM-${uniqueSuffix}`;
    const registrationNumber = `REG-${uniqueSuffix}`;

    let student: any;
    try {
      student = await Student.create({
        user: user._id,
        studentId: studentCode,
        admissionNumber,
        registrationNumber,
        firstName,
        middleName: middleName || undefined,
        lastName,
        gender,
        dob: dobDate,
        phone: data.phone?.trim() || parent.phone || "+15551234567",
        city: data.city?.trim() || undefined,
        state: data.state?.trim() || undefined,
        country: data.country?.trim() || undefined,
        schoolCollege: data.schoolCollege?.trim() || undefined,
        status: "active",
        preferences: {
          language: "en",
          timezone: "UTC",
          notificationPref: "email",
        },
      });
    } catch (studentErr) {
      await User.findByIdAndDelete(user._id);
      throw studentErr;
    }

    // Create ParentStudentLink
    let link: any;
    try {
      link = await ParentStudentLink.create({
        parent: parentId,
        student: student._id,
        relationshipType,
        priority: 1,
        isEmergencyContact: true,
        isCustodial: true,
        isPickupAuthorized: true,
        canAccessPortal: true,
        canReceiveNotifications: true,
        notificationChannels: {
          email: true,
          sms: false,
          whatsapp: false,
          push: true,
        },
      });
    } catch (linkErr) {
      await Student.findByIdAndDelete(student._id);
      await User.findByIdAndDelete(user._id);
      throw linkErr;
    }

    return {
      linkId: link._id,
      studentId: student._id,
      studentCode: student.studentId,
      firstName: student.firstName,
      middleName: student.middleName || "",
      lastName: student.lastName,
      name: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" "),
      gender: student.gender,
      dob: student.dob,
      age: calculateAge(student.dob),
      phone: student.phone,
      city: student.city || "",
      state: student.state || "",
      country: student.country || "",
      schoolCollege: student.schoolCollege || "",
      relationshipType: link.relationshipType,
      isCustodial: link.isCustodial,
      isEmergencyContact: link.isEmergencyContact,
      canAccessPortal: link.canAccessPortal,
      status: student.status,
    };
  }


  /**
   * Retrieves the Parent's onboarding and state machine status.
   * STATE 1: No children -> Add Child
   * STATE 2: Child exists, no demo -> approved next/demo action
   * STATE 3: Demo scheduled -> scheduled demo + join when eligible
   * STATE 4: Demo completed / payment required -> invoice/payment
   * STATE 5: Payment completed + enrollment active -> normal learning dashboard
   */
  static async getParentStatus(parentId: mongoose.Types.ObjectId, studentIdStr?: string) {
    const children = await this.getLinkedChildren(parentId);
    
    if (children.length === 0) {
      return { state: "STATE_1", description: "No children linked", action: "add_child" };
    }

    const parent = await Parent.findById(parentId);
    if (!parent) {
      throw new ApiError(404, "Parent not found", ERROR_CODES.NOT_FOUND);
    }

    let childIds = children.map((c) => c.studentId);
    if (studentIdStr) {
      const isLinked = children.some(c => c.studentId.toString() === studentIdStr);
      if (!isLinked) {
        throw new ApiError(403, "Access denied: student not linked", ERROR_CODES.FORBIDDEN);
      }
      childIds = [new (mongoose.Types.ObjectId as any)(studentIdStr)];
    }

    // Check for enrollment for any of the children
    const enrollment = await Enrollment.findOne({
      student: { $in: childIds },
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    if (enrollment) {
      const courseDoc = await Course.findById(enrollment.course).select("courseName courseCode slug");
      const invoiceDoc = await Invoice.findOne({ enrollment: enrollment._id, isDeleted: { $ne: true } });
      if (enrollment.status === "waiting-payment") {
        return {
          state: "STATE_4",
          description: "Payment required",
          action: "payment",
          enrollmentId: enrollment._id,
          enrollmentNumber: enrollment.enrollmentNumber,
          courseId: enrollment.course,
          courseName: courseDoc?.courseName,
          courseCode: courseDoc?.courseCode,
          invoiceId: invoiceDoc?._id,
          invoiceNumber: invoiceDoc?.invoiceNumber,
          totalAmount: invoiceDoc?.totalAmount,
          outstandingAmount: invoiceDoc?.outstandingAmount,
        };
      }
      if (["confirmed", "batch-assigned", "learning-started"].includes(enrollment.status)) {
        return {
          state: "STATE_5",
          description: "Enrollment active",
          action: "dashboard",
          enrollmentId: enrollment._id,
          enrollmentNumber: enrollment.enrollmentNumber,
          courseId: enrollment.course,
          courseName: courseDoc?.courseName,
          status: enrollment.status,
        };
      }
    }

    // Check for demo via DemoSession
    const demoQuery: any = { isDeleted: { $ne: true } };
    if (studentIdStr) {
      demoQuery.student = { $in: childIds };
    } else {
      demoQuery.$or = [{ parent: parentId }, { student: { $in: childIds } }];
    }
    const demo = await DemoSession.findOne(demoQuery).sort({ createdAt: -1 });
    
    // Fallback to Lead if no DemoSession explicitly linked by parent/student ID
    let leadDemo = null;
    if (!demo) {
      const leadQuery: any = { isDeleted: { $ne: true } };
      if (studentIdStr) {
        leadQuery.student = studentIdStr;
      } else {
        leadQuery.email = parent.email;
      }
      const lead = await Lead.findOne(leadQuery).sort({ createdAt: -1 });
      if (lead) {
        leadDemo = await DemoSession.findOne({ lead: lead._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        
        // Prevent cross-child leakage from Lead fallback
        if (leadDemo && studentIdStr && leadDemo.student && leadDemo.student.toString() !== studentIdStr) {
          leadDemo = null;
        }

        if (!leadDemo && lead.status === "demo_scheduled") {
           // We can't strictly isolate a legacy lead status if no DemoSession exists, but if it has a student attached we should check
           if (!studentIdStr || (lead.student && lead.student.toString() === studentIdStr)) {
              return { state: "STATE_3", description: "Demo scheduled (Legacy)", action: "join_demo", leadId: lead._id };
           }
        }
        if (!leadDemo && lead.status === "demo_completed") {
           if (!studentIdStr || (lead.student && lead.student.toString() === studentIdStr)) {
              return { state: "STATE_4", description: "Demo completed (Legacy)", action: "payment", leadId: lead._id };
           }
        }
      }
    }

    const activeDemo = demo || leadDemo;
    
    if (activeDemo) {
      if (["scheduled", "live"].includes(activeDemo.status)) {
        return { state: "STATE_3", description: "Demo scheduled", action: "join_demo", demoId: activeDemo._id };
      }
      if (activeDemo.status === "completed") {
        const demoCourse = activeDemo.course ? await Course.findById(activeDemo.course).select("courseName courseCode slug") : null;
        return {
          state: "STATE_4",
          description: "Demo completed",
          action: "payment",
          demoId: activeDemo._id,
          demoCode: activeDemo.demoCode,
          courseId: activeDemo.course,
          courseName: demoCourse?.courseName || activeDemo.interestedCourse,
          courseCode: demoCourse?.courseCode,
        };
      }
    }

    return { state: "STATE_2", description: "Child exists, no active demo", action: "schedule_demo" };
  }

  /**
   * Retrieves the scheduled demo for the parent.
   */
  static async getParentDemo(parentId: mongoose.Types.ObjectId, studentIdStr?: string) {
    const parent = await Parent.findById(parentId);
    if (!parent) {
      throw new ApiError(404, "Parent not found", ERROR_CODES.NOT_FOUND);
    }

    const children = await this.getLinkedChildren(parentId);
    let childIds = children.map((c) => c.studentId);
    
    if (studentIdStr) {
      const isLinked = children.some(c => c.studentId.toString() === studentIdStr);
      if (!isLinked) {
        throw new ApiError(403, "Access denied: student not linked", ERROR_CODES.FORBIDDEN);
      }
      childIds = [new (mongoose.Types.ObjectId as any)(studentIdStr)];
    }

    // Look for DemoSession
    const demoQuery: any = {
      status: { $in: ["scheduled", "live", "completed"] },
      isDeleted: { $ne: true }
    };
    if (studentIdStr) {
      demoQuery.student = { $in: childIds };
    } else {
      demoQuery.$or = [{ parent: parentId }, { student: { $in: childIds } }];
    }
    
    let demo = await DemoSession.findOne(demoQuery).sort({ createdAt: -1 });

    if (!demo) {
      const lead = await Lead.findOne({ 
        email: parent.email, 
        isDeleted: { $ne: true } 
      }).sort({ createdAt: -1 });

      if (lead) {
        demo = await DemoSession.findOne({ 
          lead: lead._id, 
          status: { $in: ["scheduled", "live", "completed"] },
          isDeleted: { $ne: true } 
        }).sort({ createdAt: -1 });

        // Prevent cross-child leakage from Lead fallback
        if (demo && studentIdStr && demo.student && demo.student.toString() !== studentIdStr) {
          demo = null;
        }
        
        // Legacy fallback
        if (!demo && ["demo_scheduled", "demo_completed"].includes(lead.status)) {
           if (!studentIdStr || (lead.student && lead.student.toString() === studentIdStr)) {
             const scheduledSlotTag = lead.tags?.find((t: string) => t.startsWith("slot:"));
             const scheduledTime = scheduledSlotTag ? scheduledSlotTag.split("slot:")[1] : "Pending confirmation";
             return {
               leadId: lead._id,
               leadCode: lead.leadId,
               status: lead.status,
               interestedCourse: lead.interestedCourse,
               scheduledTime,
               joinEligible: false, // Legacy cannot join properly without room
               notes: lead.notes,
             };
           }
        }
      }
    }

    if (!demo) {
      return null;
    }

    // Join logic: Only allowed to join 15 minutes before and until end
    const now = new Date();
    const joinWindowStart = new Date(demo.scheduledStart.getTime() - 15 * 60000);
    const joinWindowEnd = new Date(demo.scheduledEnd);
    const isTimeEligible = now >= joinWindowStart && now <= joinWindowEnd;

    let teacherInfo: { id: string; name: string } | null = null;
    if (demo.teacher) {
      const teacherDoc = await Teacher.findById(demo.teacher).select("firstName lastName");
      if (teacherDoc) {
        teacherInfo = {
          id: teacherDoc._id.toString(),
          name: `${teacherDoc.firstName} ${teacherDoc.lastName}`.trim(),
        };
      }
    }
    
    return {
      demoId: demo._id,
      demoCode: demo.demoCode,
      studentId: demo.student,
      status: demo.status,
      interestedCourse: demo.interestedCourse,
      scheduledTime: demo.scheduledStart.toLocaleString(),
      scheduledStart: demo.scheduledStart,
      scheduledEnd: demo.scheduledEnd,
      joinEligible: (demo.status === "scheduled" || demo.status === "live") && isTimeEligible,
      meetingPlatform: demo.meetingPlatform,
      duration: demo.duration,
      teacher: teacherInfo,
      teacherStatus: teacherInfo ? "Assigned" : "Finalizing",
      courseId: demo.course,
      courseName: demo.interestedCourse,
    };
  }

  /**
   * Schedules a demo session for the authenticated Parent and authorized child.
   */
  static async scheduleParentDemo(
    parentId: mongoose.Types.ObjectId,
    studentId: mongoose.Types.ObjectId,
    data: {
      courseId?: string;
      programInterest?: string;
      preferredTime?: string;
      preferredDate?: string;
      slotId?: string;
      notes?: string;
      parentEmail?: string;
      parentName?: string;
      childName?: string;
    }
  ) {
    const parent = await Parent.findById(parentId);
    if (!parent) {
      throw new ApiError(404, "Parent profile not found", ERROR_CODES.NOT_FOUND);
    }

    const { student } = await this.authorizeChildAccess(parentId, studentId.toString());

    // Enforce Canonical Course
    const courseDoc = await Course.findOne({
      $or: [
        { _id: data.courseId },
        { slug: data.programInterest?.toLowerCase() },
        { courseName: new RegExp(`^${data.programInterest || "Junior Foundation"}$`, "i") },
      ],
      status: "published",
      isDeleted: { $ne: true },
    });
    
    if (!courseDoc) {
      throw new ApiError(400, "Invalid or unrecognized program selected", ERROR_CODES.VALIDATION_ERROR);
    }
    
    const programName = (courseDoc as any).courseName;
    const courseId = (courseDoc as any)._id;

    // 1. Ensure a Lead record exists for CRM synchronization
    let lead = await Lead.findOne({ email: parent.email, isDeleted: { $ne: true } });
    const childFullName = `${student.firstName} ${student.lastName}`.trim();
    const parentFullName = `${parent.firstName} ${parent.lastName}`.trim();

    if (!lead) {
      const leadCount = await Lead.countDocuments();
      const leadId = `LED-${Date.now().toString().slice(-4)}${String(leadCount + 1).padStart(4, "0")}`;
      lead = await Lead.create({
        leadId,
        fullName: parentFullName,
        email: parent.email,
        phone: parent.phone || "0000000000",
        interestedCourse: programName,
        course: courseId,
        parent: parent._id,
        student: student._id,
        country: parent.country || "USA",
        state: parent.state || "Unknown",
        city: parent.city || "Unknown",
        leadSource: "parent-portal",
        learningMode: "live",
        priority: "high",
        status: "demo_scheduled",
        notes: `Authenticated Parent demo booking for child ${childFullName}`,
        tags: ["parent-portal", "authenticated-demo", `child:${childFullName}`],
      });
    } else {
      await Lead.findByIdAndUpdate(lead._id, {
        status: "demo_scheduled",
        fullName: parentFullName,
        interestedCourse: programName,
        course: courseId,
        parent: parent._id,
        student: student._id,
        $addToSet: { tags: { $each: ["parent-portal", "authenticated-demo", `child:${childFullName}`] } },
      });
    }

    // 2. Determine scheduled start & end
    let scheduledStart = new Date();
    
    // 3. Create or update active DemoSession for this parent & child
    let demo;
    let previousStart: number | null = null;

    if (data.slotId) {
      // 1. Atomically reserve slot
      const slot = await DemoAvailability.findOneAndUpdate(
        {
          _id: data.slotId,
          status: "available",
          bookedCount: { $lt: 1 },
          isDeleted: { $ne: true },
        },
        {
          $inc: { bookedCount: 1 },
          $set: { status: "booked" },
        },
        { new: true }
      );

      if (!slot) {
        throw new ApiError(
          400,
          "The selected time slot is no longer available. Please choose another.",
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      try {
        // 2. Find existing active demo for this child or create a new DemoSession
        demo = await DemoSession.findOne({
          parent: parentId,
          student: student._id,
          status: { $in: ["scheduled", "live"] },
          isDeleted: { $ne: true },
        });

        if (demo) {
          previousStart = new Date(demo.scheduledStart).getTime();
        }

        const demoCode = `DEMO-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

        let assignedTeacher: any = null;
        if (courseId) {
          const selection = await DemoTeacherService.selectDemoTeacher(courseId, slot.scheduledStart, slot.scheduledEnd, demo?._id);
          assignedTeacher = selection.teacher;
        } else if (slot.teacher) {
          const check = await DemoTeacherService.checkTeacherConflict(slot.teacher, slot.scheduledStart, slot.scheduledEnd, demo?._id);
          if (check.available) {
            assignedTeacher = await Teacher.findById(slot.teacher);
          }
        }

        const demoTeacher = assignedTeacher ? assignedTeacher._id : undefined;

        if (demo) {
          demo.lead = lead._id;
          demo.interestedCourse = programName;
          demo.course = courseId;
          demo.teacher = demoTeacher || demo.teacher;
          demo.scheduledStart = slot.scheduledStart;
          demo.scheduledEnd = slot.scheduledEnd;
          demo.duration = slot.duration;
          demo.meetingPlatform = "jitsi";
          demo.meetingLink = `/parent/demo/join`;
          demo.status = "scheduled";
          await demo.save();
        } else {
          demo = await DemoSession.create({
            demoCode,
            lead: lead._id,
            parent: parent._id,
            student: student._id,
            teacher: demoTeacher,
            interestedCourse: programName,
            course: courseId,
            scheduledStart: slot.scheduledStart,
            scheduledEnd: slot.scheduledEnd,
            duration: slot.duration,
            meetingPlatform: "jitsi",
            meetingLink: `/parent/demo/join`,
            status: "scheduled",
          });
        }

        // Link booked demo session to slot
        slot.bookedDemoSession = demo._id;
        await slot.save();

        scheduledStart = demo.scheduledStart;
      } catch (bookingError) {
        // Rollback atomic reservation on failure
        await DemoAvailability.findByIdAndUpdate(data.slotId, {
          $inc: { bookedCount: -1 },
          $set: { status: "available" },
        });
        throw bookingError;
      }
    } else {
      // Fallback: Free-form scheduling (if allowed)
      scheduledStart.setHours(scheduledStart.getHours() + 24); // Default tomorrow
      if (data.preferredDate) {
        const parsedDate = new Date(data.preferredDate);
        if (!isNaN(parsedDate.getTime())) {
          scheduledStart = parsedDate;
        }
      }
      if (data.preferredTime) {
        const match = data.preferredTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === "PM" && hours < 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;
          scheduledStart.setHours(hours, minutes, 0, 0);
          if (scheduledStart < new Date()) {
            scheduledStart.setDate(scheduledStart.getDate() + 1);
          }
        }
      }
      const scheduledEnd = new Date(scheduledStart.getTime() + 45 * 60000);

      demo = await DemoSession.findOne({
        parent: parentId,
        student: student._id,
        status: { $in: ["scheduled", "live"] },
        isDeleted: { $ne: true },
      });

      let assignedTeacher: any = null;
      const selection = await DemoTeacherService.selectDemoTeacher(courseId, scheduledStart, scheduledEnd, demo?._id);
      assignedTeacher = selection.teacher;
      const demoTeacher = assignedTeacher ? assignedTeacher._id : undefined;

      if (demo) {
        previousStart = new Date(demo.scheduledStart).getTime();
        demo.interestedCourse = programName;
        demo.course = courseId;
        demo.teacher = demoTeacher || demo.teacher;
        demo.scheduledStart = scheduledStart;
        demo.scheduledEnd = scheduledEnd;
        demo.meetingPlatform = "jitsi";
        demo.meetingLink = `/parent/demo/join`;
        await demo.save();
      } else {
        const demoCode = `DEMO-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
        demo = await DemoSession.create({
          demoCode,
          lead: lead._id,
          parent: parent._id,
          student: student._id,
          teacher: demoTeacher,
          interestedCourse: programName,
          course: courseId,
          scheduledStart,
          scheduledEnd,
          duration: 45,
          meetingPlatform: "jitsi",
          meetingLink: `/parent/demo/join`,
          status: "scheduled",
        });
      }
    }

    // Determine if this is a reschedule of an existing demo
    const isRescheduled = previousStart !== null && previousStart !== demo.scheduledStart.getTime();
    if (isRescheduled) {
      // Cancel previous pending reminder jobs for this demo
      await JobEngineService.cancelJobs({
        entityType: "DemoSession",
        entityId: demo._id.toString(),
        jobType: "demo.reminder",
        reason: "Demo rescheduled to a new time",
      });
    }

    const parentTimezone = (parent as any).timezone || (parent as any).preferences?.timezone || "UTC";

    // Deterministic idempotency key protects against duplicate booking confirmation emails on retry
    const bookingIdempotencyKey = isRescheduled
      ? `demo-rescheduled-${demo._id}-${demo.scheduledStart.getTime()}`
      : `demo-booking-confirm-${demo._id}`;

    const teacherName = demo.teacher
      ? await Teacher.findById(demo.teacher).then((t) => (t ? `${t.firstName} ${t.lastName}`.trim() : undefined))
      : undefined;

    await JobEngineService.scheduleJob({
      jobType: "demo.scheduled",
      entityType: "DemoSession",
      entityId: demo._id.toString(),
      payload: {
        demoId: demo._id.toString(),
        parentEmail: parent.email,
        parentName: parentFullName,
        childName: childFullName,
        programName,
        scheduledStart: demo.scheduledStart,
        scheduledEnd: demo.scheduledEnd,
        duration: demo.duration || 45,
        demoCode: demo.demoCode,
        teacherName,
        timezone: parentTimezone,
      },
      idempotencyKey: bookingIdempotencyKey,
      priority: "high",
    });

    if (demo.teacher) {
      const teacherDoc = await Teacher.findById(demo.teacher).populate("user", "email");
      const teacherEmail = teacherDoc?.email || (teacherDoc?.user as any)?.email;
      if (teacherEmail && teacherDoc) {
        await JobEngineService.scheduleJob({
          jobType: "demo.teacher_assigned",
          entityType: "DemoSession",
          entityId: demo._id.toString(),
          payload: {
            demoId: demo._id.toString(),
            teacherEmail,
            teacherName: `${teacherDoc.firstName} ${teacherDoc.lastName}`.trim(),
            childName: childFullName,
            programName,
            scheduledStart: demo.scheduledStart,
            scheduledEnd: demo.scheduledEnd,
            duration: demo.duration || 45,
            demoCode: demo.demoCode,
          },
          priority: "high",
        });
      }
    }

    // Schedule T-25 reminder (25 minutes prior to session start), if in the future
    const reminderTime = new Date(demo.scheduledStart.getTime() - 25 * 60 * 1000);
    if (reminderTime > new Date()) {
      await JobEngineService.scheduleJob({
        jobType: "demo.reminder",
        entityType: "DemoSession",
        entityId: demo._id.toString(),
        payload: {
          demoId: demo._id.toString(),
          parentEmail: parent.email,
          parentName: parentFullName,
          childName: childFullName,
          programName,
          scheduledStart: demo.scheduledStart,
          duration: demo.duration || 45,
          demoCode: demo.demoCode,
          timezone: parentTimezone,
        },
        idempotencyKey: `demo-reminder-${demo._id}-${demo.scheduledStart.getTime()}`,
        priority: "normal",
        scheduledAt: reminderTime,
      });
    }

    // Immediately trigger processing for the confirmation job so email is dispatched right away
    try {
      const { registerJobHandlers } = await import("../jobs/job-handlers");
      registerJobHandlers();
      await JobEngineService.processNextJob();
    } catch {
      // Non-blocking: background job engine will process queued job
    }

    let teacherInfo: { id: string; name: string } | null = null;
    if (demo.teacher) {
      const teacherDoc = await Teacher.findById(demo.teacher).select("firstName lastName");
      if (teacherDoc) {
        teacherInfo = {
          id: teacherDoc._id.toString(),
          name: `${teacherDoc.firstName} ${teacherDoc.lastName}`.trim(),
        };
      }
    }

    return {
      demoId: demo._id,
      demoCode: demo.demoCode,
      status: demo.status,
      interestedCourse: demo.interestedCourse,
      scheduledStart: demo.scheduledStart,
      scheduledEnd: demo.scheduledEnd,
      scheduledTime: demo.scheduledStart.toLocaleString(),
      childName: childFullName,
      teacher: teacherInfo,
      teacherStatus: teacherInfo ? "Assigned" : "Finalizing",
    };
  }

  /**
   * CANCEL DEMO SESSION
   * Cancels scheduled demo session and cancels any pending reminder jobs.
   */
  static async cancelParentDemo(parentId: mongoose.Types.ObjectId, demoId: string, reason?: string) {
    const demo = await DemoSession.findOne({
      _id: demoId,
      parent: parentId,
      isDeleted: { $ne: true },
    });
    if (!demo) {
      throw new ApiError(404, "Demo session not found", ERROR_CODES.NOT_FOUND);
    }

    demo.status = "cancelled";
    await demo.save();

    // Cancel pending reminder jobs
    await JobEngineService.cancelJobs({
      entityType: "DemoSession",
      entityId: demo._id.toString(),
      jobType: "demo.reminder",
      reason: reason || "Demo cancelled by parent",
    });

    return {
      success: true,
      demoId: demo._id,
      status: "cancelled",
    };
  }


  /**
   * CANONICAL SELECTED-CHILD DASHBOARD CONTEXT
   * Aggregates real metrics scoped strictly to the authorized child.
   */
  static async getChildDashboard(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    // 1. Enrolled Batches & Courses
    const batchEnrollments = await BatchStudent.find({
      student: studentId,
      status: "active",
      isDeleted: { $ne: true },
    }).populate({
      path: "batch",
      populate: [
        { path: "course", select: "courseName courseCode slug duration durationUnit" },
        { path: "primaryTeacher", select: "firstName lastName designation" },
      ],
    });

    const enrolledBatches = batchEnrollments.map((be: any) => be.batch).filter(Boolean);
    const batchIds = enrolledBatches.map((b: any) => b._id);

    // 2. Attendance Summary
    const attSummary = await AttendanceSummary.findOne({
      student: studentId,
      isDeleted: { $ne: true },
    });

    const totalSessions = attSummary?.totalClasses ?? (attSummary as any)?.totalSessions ?? 0;
    const presentSessions = attSummary?.presentCount || 0;
    const attendancePercentage =
      attSummary?.attendancePercentage !== undefined
        ? attSummary.attendancePercentage
        : totalSessions > 0
        ? Math.round((presentSessions / totalSessions) * 100)
        : null;

    // 3. Upcoming Live Classes
    const upcomingLiveClasses = await LiveClass.find({
      batch: { $in: batchIds },
      startDate: { $gte: new Date(Date.now() - 3600000) },
      status: {
        $nin: ["cancelled", "Cancelled", "CANCELLED", "archived", "Archived", "completed", "Completed", "missed", "Missed"],
      },
      isDeleted: { $ne: true },
    })
      .sort({ startDate: 1 })
      .limit(5)
      .populate("teacher", "firstName lastName designation")
      .populate("course", "courseName courseCode")
      .populate("batch", "batchName batchCode");

    // 4. Pending Assignments
    const pendingAssignments = await Assignment.find({
      batch: { $in: batchIds },
      status: "published",
      isDeleted: { $ne: true },
    })
      .sort({ dueDate: 1 })
      .limit(3);

    // 5. Recent Assessment Results
    const recentResults = await AssessmentResult.find({
      student: studentId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("assessment", "title totalMarks passingMarks");

    // 6. Outstanding Fee Balance
    const invoices = await Invoice.find({
      student: studentId,
      isDeleted: { $ne: true },
    });
    const totalDue = invoices.reduce((acc, inv) => acc + (inv.outstandingAmount || 0), 0);

    // 7. Recent Teacher Communication
    const recentMessages = await ParentTeacherMessage.find({
      student: studentId,
      parent: parentId,
      senderRole: "teacher",
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("teacher", "firstName lastName");

    // 8. Next Demo Session
    const now = new Date();
    const nextDemo = await DemoSession.findOne({
      student: studentId,
      status: { $in: ["scheduled", "live"] },
      scheduledEnd: { $gte: now },
      isDeleted: { $ne: true },
    })
      .populate("teacher", "firstName lastName")
      .sort({ scheduledStart: 1 });

    const joinWindowStart = nextDemo ? new Date(nextDemo.scheduledStart.getTime() - 15 * 60000) : null;
    const isTimeEligible = nextDemo && joinWindowStart ? now >= joinWindowStart && now <= nextDemo.scheduledEnd : false;

    return {
      student: {
        id: student._id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        status: student.status,
      },
      nextDemo: nextDemo ? {
        demoId: nextDemo._id,
        demoCode: nextDemo.demoCode,
        status: nextDemo.status,
        interestedCourse: nextDemo.interestedCourse,
        scheduledStart: nextDemo.scheduledStart,
        scheduledEnd: nextDemo.scheduledEnd,
        joinEligible: (nextDemo.status === "scheduled" || nextDemo.status === "live") && isTimeEligible,
        meetingPlatform: nextDemo.meetingPlatform,
        duration: nextDemo.duration,
        teacher: nextDemo.teacher ? {
          id: (nextDemo.teacher as any)._id,
          name: `${(nextDemo.teacher as any).firstName} ${(nextDemo.teacher as any).lastName}`.trim(),
        } : null,
      } : null,
      enrolledBatches: enrolledBatches.map((b: any) => ({
        id: b._id,
        batchName: b.batchName,
        batchCode: b.batchCode,
        courseName: b.course?.courseName,
        instructor: b.primaryTeacher ? `${b.primaryTeacher.firstName} ${b.primaryTeacher.lastName}` : null,
      })),
      attendance: {
        attendancePercentage,
        totalSessions,
        presentSessions,
      },
      upcomingLiveClasses: upcomingLiveClasses.map((lc: any) => {
        const teacherName = lc.teacher
          ? `${lc.teacher.firstName} ${lc.teacher.lastName}`.trim()
          : null;
        const courseName = lc.course?.courseName;
        const batchName = lc.batch?.batchName;

        return {
          id: lc._id.toString(),
          _id: lc._id.toString(),
          classId: lc._id.toString(),
          classCode: lc.classCode,
          classTitle: lc.classTitle,
          title: lc.classTitle,
          startDate: lc.startDate,
          startAt: lc.startDate,
          endDate: lc.endDate,
          endAt: lc.endDate,
          duration: lc.duration,
          status: lc.status,
          courseName,
          course: courseName,
          batchName,
          batch: batchName,
          instructor: teacherName,
          teacher: teacherName,
        };
      }),
      assignmentsCount: pendingAssignments.length,
      recentResults: recentResults.map((r: any) => ({
        id: r._id,
        title: r.assessment?.title,
        score: r.score,
        percentage: r.percentage,
        isPassed: r.isPassed,
      })),
      feeOverview: {
        totalInvoices: invoices.length,
        totalDue,
      },
      recentTeacherCommunication: recentMessages.map((msg: any) => ({
        id: msg._id,
        message: msg.message,
        createdAt: msg.createdAt,
        teacherName: msg.teacher ? `${msg.teacher.firstName} ${msg.teacher.lastName}` : "Teacher",
      })),
    };
  }

  /**
   * Attendance details for child.
   */
  static async getChildAttendance(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    const summaries = await AttendanceSummary.find({ student: studentId, isDeleted: { $ne: true } });
    const records = await Attendance.find({ student: studentId, isDeleted: { $ne: true } })
      .sort({ attendanceDate: -1, createdAt: -1 })
      .limit(30)
      .populate("liveClass", "classTitle");

    let totalSessions = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let currentStreak = 0;
    let longestStreak = 0;

    if (summaries && summaries.length > 0) {
      for (const summary of summaries) {
        totalSessions += summary.totalClasses ?? (summary as any).totalSessions ?? 0;
        presentCount += summary.presentCount ?? 0;
        lateCount += summary.lateCount ?? 0;
        absentCount += summary.absentCount ?? 0;
        excusedCount += summary.excusedCount ?? 0;
        currentStreak = Math.max(currentStreak, summary.currentStreak ?? 0);
        longestStreak = Math.max(longestStreak, summary.longestStreak ?? 0);
      }
    } else if (records && records.length > 0) {
      totalSessions = records.length;
      presentCount = records.filter((r) => ["present", "left-early"].includes(r.status)).length;
      lateCount = records.filter((r) => r.status === "late").length;
      absentCount = records.filter((r) => r.status === "absent" || r.status === "no-response").length;
      excusedCount = records.filter((r) => r.status === "excused").length;
    }

    const eligibleCount = presentCount + lateCount;
    const attendancePercentage = totalSessions > 0 ? Math.round((eligibleCount / totalSessions) * 100) : null;

    return {
      summary: {
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendancePercentage,
        currentStreak,
        longestStreak,
      },
      records: records.map((r: any) => ({
        id: r._id,
        date: r.attendanceDate || r.createdAt,
        status: r.status,
        mode: r.mode,
        durationAttended: r.durationAttended || 0,
        classTitle: r.liveClass?.classTitle,
        remarks: r.remarks,
      })),
    };
  }

  /**
   * Academic progress for child.
   */
  static async getChildAcademics(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    const batchStudents = await BatchStudent.find({
      student: studentId,
      status: "active",
      isDeleted: { $ne: true },
    }).populate({
      path: "batch",
      populate: { path: "course" },
    });

    const courses = batchStudents.map((bs: any) => bs.batch?.course).filter(Boolean);

    return {
      courses: courses.map((c: any) => ({
        id: c._id,
        name: c.courseName,
        code: c.courseCode,
        difficulty: c.difficulty,
        duration: `${c.duration} ${c.durationUnit}`,
        category: c.category,
      })),
    };
  }

  /**
   * Assessments for child, including scores and feedback.
   */
  static async getChildAssessments(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    // Fetch batches for pending assessments
    const batchStudents = await BatchStudent.find({ student: studentId, status: "active", isDeleted: { $ne: true } });
    const batchIds = batchStudents.map((b) => b.batch);

    const pendingAssessments = await Assessment.find({
      batch: { $in: batchIds },
      status: "published",
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    // Fetch all assessment results for this student
    const results = await AssessmentResult.find({
      student: studentId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "assessment",
        select: "title description type maximumMarks passingMarks duration status"
      })
      .populate({
        path: "attempt",
        select: "status submittedAt startedAt"
      });

    const evaluatedResponse = results.map((r: any) => ({
      id: r._id,
      assessmentId: r.assessment?._id,
      title: r.assessment?.title,
      description: r.assessment?.description,
      type: r.assessment?.type,
      maximumMarks: r.assessment?.maximumMarks,
      passingMarks: r.assessment?.passingMarks,
      duration: r.assessment?.duration,
      status: r.status || r.attempt?.status || r.assessment?.status,
      submittedAt: r.attempt?.submittedAt,
      startedAt: r.attempt?.startedAt,
      scoreObtained: r.totalMarksObtained,
      percentage: r.percentage,
      isPassed: r.status === "pass",
      feedback: r.grade, // Using grade as feedback placeholder if feedback doesn't exist
      evaluatedAt: r.createdAt
    }));

    const resultAssessmentIds = new Set(evaluatedResponse.map(r => r.assessmentId?.toString()));

    const { AssessmentAttempt } = await import("../../models/assessment-attempt.model");
    const attempts = await AssessmentAttempt.find({ student: studentId });
    const attemptsByAssessment = attempts.reduce((acc: any, curr: any) => {
      const aId = curr.assessment.toString();
      acc[aId] = (acc[aId] || 0) + 1;
      return acc;
    }, {});

    const pendingResponse = pendingAssessments
      .filter((a: any) => !resultAssessmentIds.has(a._id.toString()))
      .filter((a: any) => {
        const attemptCount = attemptsByAssessment[a._id.toString()] || 0;
        const limit = a.attemptLimit || 1;
        return attemptCount < limit;
      })
      .map((a: any) => ({
        id: "pending_" + a._id.toString(),
        assessmentId: a._id,
        title: a.title,
        description: a.description,
        type: a.type,
        maximumMarks: a.maximumMarks,
        passingMarks: a.passingMarks,
        duration: a.duration,
        status: "pending",
        isPassed: false,
      }));

    return [...pendingResponse, ...evaluatedResponse];
  }

  /**
   * Assignments for child, including attachments and evaluations.
   */
  static async getChildAssignments(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    const batchStudents = await BatchStudent.find({ student: studentId, status: "active", isDeleted: { $ne: true } });
    const batchIds = batchStudents.map((b) => b.batch);

    const assignments = await Assignment.find({
      batch: { $in: batchIds },
      status: { $in: ["published", "closed", "archived"] },
      isDeleted: { $ne: true },
    }).sort({ dueDate: -1 });

    const assignmentIds = assignments.map((a) => a._id);

    // Fetch submissions for this student
    const submissions = await AssignmentSubmission.find({
      student: studentId,
      assignment: { $in: assignmentIds },
      isDeleted: { $ne: true },
    }).sort({ attemptNumber: -1 });

    // Fetch evaluations for these submissions
    const submissionIds = submissions.map((s) => s._id);
    const evaluations = await AssignmentEvaluation.find({
      submission: { $in: submissionIds },
      isDeleted: { $ne: true },
    });
    const evaluationMap = new Map();
    evaluations.forEach((ev) => evaluationMap.set(ev.submission.toString(), ev));

    // Map submissions per assignment
    const submissionMap = new Map();
    const submissionCountMap = new Map<string, number>();
    submissions.forEach((s) => {
      const aKey = s.assignment.toString();
      submissionCountMap.set(aKey, (submissionCountMap.get(aKey) || 0) + 1);
      if (!submissionMap.has(aKey)) {
        submissionMap.set(aKey, s);
      }
    });

    // Fetch downloadable attachments for these assignments
    const attachments = await AssignmentAttachment.find({
      assignment: { $in: assignmentIds },
      isDeleted: { $ne: true },
    });
    const attachmentMap = new Map<string, any[]>();
    attachments.forEach((att) => {
      const aKey = att.assignment.toString();
      if (!attachmentMap.has(aKey)) {
        attachmentMap.set(aKey, []);
      }
      attachmentMap.get(aKey)!.push({
        id: att._id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        fileType: att.fileType,
      });
    });

    return assignments.map((a: any) => {
      const aKey = a._id.toString();
      const sub = submissionMap.get(aKey);
      const ev = sub ? evaluationMap.get(sub._id.toString()) : null;
      const totalAttemptsUsed = submissionCountMap.get(aKey) || 0;
      const isPastDue = new Date() > new Date(a.dueDate);
      const canSubmit =
        a.status === "published" &&
        totalAttemptsUsed < (a.maxAttempts || 1) &&
        (!isPastDue || a.lateSubmissionAllowed);

      return {
        id: a._id,
        title: a.title,
        description: a.description,
        instructions: a.instructions,
        type: a.type,
        difficultyLevel: a.difficultyLevel,
        totalMarks: a.totalMarks,
        passingMarks: a.passingMarks,
        dueDate: a.dueDate,
        status: a.status,
        maxAttempts: a.maxAttempts || 1,
        totalAttemptsUsed,
        canSubmit,
        lateSubmissionAllowed: a.lateSubmissionAllowed,
        attachments: attachmentMap.get(aKey) || [],
        submission: sub
          ? {
              id: sub._id,
              submissionNumber: sub.submissionNumber,
              submittedAt: sub.submittedAt || sub.createdAt,
              attemptNumber: sub.attemptNumber,
              status: sub.status,
              lateSubmission: sub.lateSubmission,
              files: sub.files || [],
              links: sub.links || [],
              comments: sub.comments,
              marksAwarded: ev ? ev.marksObtained : undefined,
              grade: ev ? ev.grade : undefined,
              feedback: ev ? ev.feedback : undefined,
              isGraded: !!ev,
            }
          : null,
      };
    });
  }

  /**
   * Submit coursework on behalf of authorized child.
   * Persists AssignmentSubmission.student = child's Student._id.
   */
  static async submitChildAssignment(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    assignmentIdStr: string,
    payload: {
      files?: string[];
      links?: string[];
      comments?: string;
    }
  ) {
    // 1. Canonical Parent-Child Authorization
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    if (!mongoose.isValidObjectId(assignmentIdStr)) {
      throw new ApiError(400, "Invalid Assignment ID", ERROR_CODES.VALIDATION_ERROR);
    }
    const assignmentId = new (mongoose.Types.ObjectId as any)(assignmentIdStr);

    // 2. Validate Assignment existence and status
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.isDeleted) {
      throw new ApiError(404, "Assignment not found", ERROR_CODES.NOT_FOUND);
    }

    if (assignment.status !== "published") {
      throw new ApiError(400, "Assignment is not open for submissions", ERROR_CODES.VALIDATION_ERROR);
    }

    // 3. Verify student is actively enrolled in the batch this assignment belongs to
    const batchStudent = await BatchStudent.findOne({
      student: studentId,
      batch: assignment.batch,
      status: "active",
      isDeleted: { $ne: true },
    });

    if (!batchStudent) {
      throw new ApiError(
        403,
        "Student is not enrolled in the batch for this assignment",
        ERROR_CODES.FORBIDDEN
      );
    }

    // 4. Validate payload: files & links
    const files = Array.isArray(payload.files) ? payload.files.filter((f) => typeof f === "string" && f.trim()) : [];
    const links = Array.isArray(payload.links) ? payload.links.filter((l) => typeof l === "string" && l.trim()) : [];
    const comments = typeof payload.comments === "string" ? payload.comments.trim() : undefined;

    if (files.length === 0 && links.length === 0 && !comments) {
      throw new ApiError(
        400,
        "At least one file, link, or submission comment is required",
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Validate file extensions if files are provided
    const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".zip", ".csv", ".xlsx", ".pptx"];
    for (const file of files) {
      const cleanPath = file.split("?")[0].toLowerCase();
      const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => cleanPath.endsWith(ext));
      if (!hasValidExt && !file.startsWith("http://") && !file.startsWith("https://") && !file.startsWith("data:")) {
        throw new ApiError(
          400,
          `Unsupported file type for '${file}'. Supported types: ${ALLOWED_EXTENSIONS.join(", ")}`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // 5. Delegate to SubmissionService for core submission lifecycle
    try {
      const submission = await SubmissionService.submit(
        studentId.toString(),
        assignmentIdStr,
        files,
        links,
        comments
      );

      return submission;
    } catch (err: any) {
      throw new ApiError(400, err.message || "Failed to submit assignment", ERROR_CODES.VALIDATION_ERROR);
    }
  }


  /**
   * Live classes for child.
   */
  static async getChildLiveClasses(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    const batchStudents = await BatchStudent.find({ student: studentId, status: "active" });
    const batchIds = batchStudents.map((b) => b.batch);

    const liveClasses = await LiveClass.find({
      batch: { $in: batchIds },
      isDeleted: { $ne: true },
    })
      .sort({ startDate: -1 })
      .populate("teacher", "firstName lastName designation")
      .populate("course", "courseName");

    // Fetch attendance records for this student across these live classes
    const classIds = liveClasses.map((lc) => lc._id);
    const attendanceRecords = await Attendance.find({
      student: studentId,
      liveClass: { $in: classIds },
      isDeleted: { $ne: true },
    });
    const attMap = new Map();
    attendanceRecords.forEach((att) => attMap.set(att.liveClass.toString(), att));

    const now = new Date();

    return liveClasses.map((lc: any) => {
      const att = attMap.get(lc._id.toString());
      const startDate = new Date(lc.startDate);
      const isPast = now.getTime() > (startDate.getTime() + (lc.duration || 60) * 60000);
      const isLiveNow = lc.status === "live" || (now >= startDate && !isPast);
      const isStartingSoon = !isPast && !isLiveNow && startDate.getTime() <= (now.getTime() + 15 * 60000);

      let effectiveStatus = lc.status;
      if (lc.status === "cancelled") {
        effectiveStatus = "cancelled";
      } else if (att && ["present", "late", "half-day", "left-early"].includes(att.status)) {
        effectiveStatus = "attended";
      } else if (isPast && (lc.status === "completed" || !att || att.status === "absent")) {
        effectiveStatus = "missed";
      } else if (isLiveNow) {
        effectiveStatus = "live";
      } else if (isStartingSoon) {
        effectiveStatus = "starting-soon";
      } else {
        effectiveStatus = "upcoming";
      }

      return {
        id: lc._id,
        classCode: lc.classCode,
        classTitle: lc.classTitle,
        startDate: lc.startDate,
        endDate: lc.endDate,
        duration: lc.duration,
        status: lc.status,
        effectiveStatus,
        attendance: att
          ? {
              status: att.status,
              mode: att.mode,
              durationAttended: att.durationAttended || 0,
              checkInTime: att.checkInTime,
            }
          : null,
        courseName: lc.course?.courseName || "General Course",
        instructor: lc.teacher ? `${lc.teacher.firstName} ${lc.teacher.lastName}` : "Faculty Assigned",
      };
    });
  }

  /**
   * Recordings / Revision available for child's classes.
   */
  static async getChildRecordings(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    const batchStudents = await BatchStudent.find({ student: studentId, status: "active" });
    const batchIds = batchStudents.map((b) => b.batch);

    const liveClasses = await LiveClass.find({
      batch: { $in: batchIds },
      isDeleted: { $ne: true },
    }).select("_id");

    const liveClassIds = liveClasses.map((lc) => lc._id);

    const recordings = await LiveClassRecording.find({
      liveClass: { $in: liveClassIds },
      status: "ready",
      isPublished: true,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "liveClass",
        select: "classTitle classCode startDate duration",
        populate: [
          { path: "teacher", select: "firstName lastName" },
          { path: "course", select: "courseName" },
        ],
      });

    return recordings.map((rec: any) => ({
      id: rec._id,
      liveClassId: rec.liveClass?._id,
      title: rec.liveClass?.classTitle || "Recorded Session",
      classCode: rec.liveClass?.classCode || "LVC-REC",
      durationMinutes: rec.durationMinutes,
      sizeBytes: rec.sizeBytes,
      recordedAt: rec.createdAt,
      instructor: rec.liveClass?.teacher ? `${rec.liveClass.teacher.firstName} ${rec.liveClass.teacher.lastName}` : "Faculty",
      courseName: rec.liveClass?.course?.courseName || "General Course",
      streamUrl: `/api/recordings/${rec._id}/stream`,
    }));
  }

  /**
   * Finance records (Invoices, fee plans, payments, line items, receipts) for child.
   */
  static async getChildFinance(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const studentId = student._id;

    const invoices = await Invoice.find({
      student: studentId,
      isDeleted: { $ne: true },
    })
      .sort({ issueDate: -1 })
      .populate("course", "courseName courseCode");

    const invoiceIds = invoices.map((i) => i._id);

    const items = await InvoiceItem.find({
      invoice: { $in: invoiceIds },
      isDeleted: { $ne: true },
    });

    const itemsByInvoice = new Map<string, any[]>();
    items.forEach((it) => {
      const key = it.invoice.toString();
      if (!itemsByInvoice.has(key)) itemsByInvoice.set(key, []);
      itemsByInvoice.get(key)!.push({
        id: it._id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      });
    });

    const payments = await Payment.find({
      student: studentId,
      isDeleted: { $ne: true },
    }).sort({ paymentDate: -1 });

    const receipts = await Receipt.find({
      invoice: { $in: invoiceIds },
      isDeleted: { $ne: true },
    }).sort({ issueDate: -1 });

    const receiptsByPayment = new Map<string, any>();
    receipts.forEach((r) => {
      receiptsByPayment.set(r.payment.toString(), {
        id: r._id,
        receiptNumber: r.receiptNumber,
        issueDate: r.issueDate,
        amount: r.amount,
        taxes: r.taxes,
      });
    });

    const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalPaid = invoices.reduce(
      (acc, i) => acc + Math.max(0, (i.totalAmount || 0) - (i.outstandingAmount || 0)),
      0
    );
    const totalDue = invoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);

    return {
      overview: {
        totalInvoiced,
        totalPaid,
        totalDue,
      },
      invoices: invoices.map((inv: any) => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        baseAmount: inv.baseAmount ?? 0,
        taxAmount: inv.taxAmount ?? 0,
        discountAmount: inv.discountAmount ?? 0,
        scholarshipAmount: inv.scholarshipAmount ?? 0,
        totalAmount: inv.totalAmount ?? 0,
        amountPaid: Math.max(0, (inv.totalAmount || 0) - (inv.outstandingAmount || 0)),
        amountDue: inv.outstandingAmount ?? 0,
        status: inv.status,
        courseName: inv.course?.courseName || "Academic Program",
        courseCode: inv.course?.courseCode || "",
        items: itemsByInvoice.get(inv._id.toString()) || [],
      })),
      payments: payments.map((p: any) => ({
        id: p._id,
        paymentNumber: p.paymentNumber,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference,
        status: p.status,
        receipt: receiptsByPayment.get(p._id.toString()) || null,
      })),
      receipts: receipts.map((r: any) => ({
        id: r._id,
        receiptNumber: r.receiptNumber,
        invoiceId: r.invoice,
        paymentId: r.payment,
        issueDate: r.issueDate,
        amount: r.amount,
        taxes: r.taxes,
      })),
    };
  }

  /**
   * Process customer-initiated payment on an invoice for an authorized child.
   * Verifies Parent ownership + ParentStudentLink + child invoice relationship.
   * Executes authoritative PaymentService.recordPayment, issues receipt, and
   * runs PaymentAutomationService.handlePaymentCompleted to activate enrollment (STATE_4 -> STATE_5).
   */
  static async payChildInvoice(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    data: {
      invoiceId: string;
      amount?: number;
      paymentMethod?: string;
    },
    parentUserId?: string
  ) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);

    if (!data.invoiceId || !mongoose.isValidObjectId(data.invoiceId)) {
      throw new ApiError(400, "Valid invoiceId is required", ERROR_CODES.VALIDATION_ERROR);
    }

    const invoice = await Invoice.findById(data.invoiceId).populate("course");
    if (!invoice || invoice.isDeleted) {
      throw new ApiError(404, "Invoice not found", ERROR_CODES.NOT_FOUND);
    }

    // Strict ownership verification: invoice must belong to this specific student
    if (invoice.student.toString() !== student._id.toString()) {
      throw new ApiError(
        403,
        "Access denied: This invoice does not belong to the selected child",
        ERROR_CODES.FORBIDDEN
      );
    }

    if (invoice.status === "paid" || invoice.outstandingAmount <= 0) {
      throw new ApiError(400, "Invoice is already fully paid", ERROR_CODES.VALIDATION_ERROR);
    }

    // Server-side amount authority: reject tampered client amounts
    if (typeof data.amount === "number" && data.amount !== invoice.outstandingAmount) {
      throw new ApiError(
        400,
        `Tampered payment amount rejected: requested ${data.amount}, authoritative balance is ${invoice.outstandingAmount}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    const paymentAmount = invoice.outstandingAmount;

    // Validate payment method against supported enum
    const validMethods = [
      "credit-card",
      "debit-card",
      "bank-transfer",
      "upi",
      "online-gateway",
      "wallet",
      "cash",
      "custom",
    ] as const;

    const paymentMethod: (typeof validMethods)[number] = validMethods.includes(
      data.paymentMethod as any
    )
      ? (data.paymentMethod as any)
      : "credit-card";

    // 1. Authoritatively record payment
    const payment = await PaymentService.recordPayment(
      {
        invoiceId: invoice._id.toString(),
        amount: paymentAmount,
        paymentMethod,
      },
      parentUserId
    );

    // 2. Automate enrollment transition & event execution
    let automationResult: any = null;
    try {
      automationResult = await PaymentAutomationService.handlePaymentCompleted(payment._id.toString());
    } catch (err: any) {
      console.error("[ParentService.payChildInvoice] Automation error:", err.message);
    }

    // 3. Fetch refreshed invoice & receipt
    const refreshedInvoice = await Invoice.findById(invoice._id);
    const receipt = await Receipt.findOne({ payment: payment._id });

    return {
      payment: {
        id: payment._id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        status: payment.status,
      },
      invoice: {
        id: refreshedInvoice?._id || invoice._id,
        invoiceNumber: refreshedInvoice?.invoiceNumber || invoice.invoiceNumber,
        totalAmount: refreshedInvoice?.totalAmount || invoice.totalAmount,
        outstandingAmount: refreshedInvoice?.outstandingAmount ?? 0,
        status: refreshedInvoice?.status || "paid",
      },
      receipt: receipt
        ? {
            id: receipt._id,
            receiptNumber: receipt.receiptNumber,
            amount: receipt.amount,
            issueDate: receipt.issueDate,
          }
        : null,
      enrollmentStatus: automationResult ? "confirmed" : undefined,
    };
  }

  /**
   * Retrieves single invoice detail for authorized child.
   * Strict verification:
   * Parent + authorized ParentStudentLink + invoice.student === child._id
   */
  static async getChildInvoiceDetail(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    invoiceIdStr: string
  ) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);

    if (!invoiceIdStr || !mongoose.isValidObjectId(invoiceIdStr)) {
      throw new ApiError(400, "Valid invoiceId is required", ERROR_CODES.VALIDATION_ERROR);
    }

    const invoice = await Invoice.findById(invoiceIdStr).populate("course", "courseName courseCode");
    if (!invoice || invoice.isDeleted) {
      throw new ApiError(404, "Invoice not found", ERROR_CODES.NOT_FOUND);
    }

    // Strict ownership verification
    if (invoice.student.toString() !== student._id.toString()) {
      throw new ApiError(
        403,
        "Access denied: This invoice does not belong to the selected child",
        ERROR_CODES.FORBIDDEN
      );
    }

    // Line items
    const items = await InvoiceItem.find({
      invoice: invoice._id,
      isDeleted: { $ne: true },
    });

    // Payments with receipts
    const payments = await Payment.find({
      invoice: invoice._id,
      isDeleted: { $ne: true },
    }).sort({ paymentDate: -1 });

    const receipts = await Receipt.find({
      invoice: invoice._id,
      isDeleted: { $ne: true },
    });

    const receiptsByPayment = new Map<string, any>();
    receipts.forEach((r) => {
      receiptsByPayment.set(r.payment.toString(), {
        id: r._id,
        receiptNumber: r.receiptNumber,
        issueDate: r.issueDate,
        amount: r.amount,
        taxes: r.taxes,
      });
    });

    return {
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      baseAmount: invoice.baseAmount ?? 0,
      taxAmount: invoice.taxAmount ?? 0,
      discountAmount: invoice.discountAmount ?? 0,
      scholarshipAmount: invoice.scholarshipAmount ?? 0,
      totalAmount: invoice.totalAmount ?? 0,
      amountPaid: Math.max(0, (invoice.totalAmount || 0) - (invoice.outstandingAmount || 0)),
      amountDue: invoice.outstandingAmount ?? 0,
      status: invoice.status,
      course: {
        id: (invoice.course as any)?._id,
        courseName: (invoice.course as any)?.courseName || "Academic Program",
        courseCode: (invoice.course as any)?.courseCode || "",
      },
      student: {
        id: student._id,
        studentCode: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      items: items.map((it) => ({
        id: it._id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      })),
      payments: payments.map((p: any) => ({
        id: p._id,
        paymentNumber: p.paymentNumber,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference,
        status: p.status,
        receipt: receiptsByPayment.get(p._id.toString()) || null,
      })),
    };
  }

  /**
   * Retrieves verified receipt voucher for authorized child.
   * Strict verification:
   * Parent + authorized ParentStudentLink + receipt.invoice.student === child._id
   */
  static async getChildReceiptDetail(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    receiptIdStr: string
  ) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);

    if (!receiptIdStr || !mongoose.isValidObjectId(receiptIdStr)) {
      throw new ApiError(400, "Valid receiptId is required", ERROR_CODES.VALIDATION_ERROR);
    }

    const receipt = await Receipt.findById(receiptIdStr);
    if (!receipt || receipt.isDeleted) {
      throw new ApiError(404, "Receipt not found", ERROR_CODES.NOT_FOUND);
    }

    const invoice = await Invoice.findById(receipt.invoice).populate("course", "courseName courseCode");
    if (!invoice || invoice.isDeleted) {
      throw new ApiError(404, "Associated invoice not found", ERROR_CODES.NOT_FOUND);
    }

    // Strict ownership verification: invoice must belong to the authorized child
    if (invoice.student.toString() !== student._id.toString()) {
      throw new ApiError(
        403,
        "Access denied: This receipt does not belong to the selected child",
        ERROR_CODES.FORBIDDEN
      );
    }

    const payment = await Payment.findById(receipt.payment);
    const parent = await Parent.findById(parentId);

    return {
      id: receipt._id,
      receiptNumber: receipt.receiptNumber,
      issueDate: receipt.issueDate,
      amount: receipt.amount,
      taxes: receipt.taxes || invoice.taxAmount || 0,
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        courseName: (invoice.course as any)?.courseName || "Academic Program",
        courseCode: (invoice.course as any)?.courseCode || "",
      },
      payment: payment
        ? {
            id: payment._id,
            paymentNumber: payment.paymentNumber,
            paymentDate: payment.paymentDate,
            paymentMethod: payment.paymentMethod,
            transactionReference: payment.transactionReference,
            status: payment.status,
          }
        : null,
      student: {
        id: student._id,
        studentCode: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      parent: {
        id: parent?._id,
        name: parent ? `${parent.firstName} ${parent.lastName}` : "Guardian",
        email: parent?.email,
      },
    };
  }

  /**
   * Generates binary PDF buffer for authorized invoice.
   */
  static async generateInvoicePdf(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    invoiceIdStr: string
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);

    if (!mongoose.isValidObjectId(invoiceIdStr)) {
      throw new ApiError(400, "Invalid Invoice ID", ERROR_CODES.VALIDATION_ERROR);
    }
    const invoiceId = new mongoose.Types.ObjectId(invoiceIdStr);

    const invoice = await Invoice.findById(invoiceId).populate("course", "courseName courseCode");
    if (!invoice || invoice.isDeleted) {
      throw new ApiError(404, "Invoice not found", ERROR_CODES.NOT_FOUND);
    }

    if (invoice.student.toString() !== student._id.toString()) {
      throw new ApiError(403, "Access denied: This invoice does not belong to the selected child", ERROR_CODES.FORBIDDEN);
    }

    const parent = await Parent.findById(parentId);

    const pdfBuffer = generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate || new Date(),
      dueDate: invoice.dueDate || new Date(),
      studentName: `${student.firstName} ${student.lastName}`,
      studentCode: student.studentId,
      parentName: parent ? `${parent.firstName} ${parent.lastName}` : "Guardian",
      courseName: (invoice.course as any)?.courseName || "Academic Program",
      baseAmount: invoice.baseAmount || 0,
      taxAmount: invoice.taxAmount || 0,
      discountAmount: invoice.discountAmount || 0,
      totalAmount: invoice.totalAmount || invoice.baseAmount || 0,
      status: invoice.status || "unpaid"
    });

    return {
      buffer: pdfBuffer,
      fileName: `Invoice_${invoice.invoiceNumber}.pdf`,
    };
  }

  /**
   * Generates binary PDF buffer for authorized receipt voucher.
   */
  static async generateReceiptPdf(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    receiptIdStr: string
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const detail = await this.getChildReceiptDetail(parentId, studentIdStr, receiptIdStr);

    const pdfBuffer = generateReceiptPdfBuffer({
      receiptNumber: detail.receiptNumber,
      issueDate: detail.issueDate,
      invoiceNumber: detail.invoice.invoiceNumber,
      studentName: `${detail.student.firstName} ${detail.student.lastName}`,
      studentCode: detail.student.studentCode,
      parentName: detail.parent.name,
      courseName: detail.invoice.courseName,
      amount: detail.amount,
      taxes: detail.taxes,
      paymentMethod: detail.payment?.paymentMethod || "online",
      transactionReference: detail.payment?.transactionReference || "N/A",
    });

    return {
      buffer: pdfBuffer,
      fileName: `Receipt-${detail.receiptNumber}.pdf`,
    };
  }

  /**
   * Notifications for parent.
   */
  static async getParentNotifications(parentUserId: string) {
    const notifications = await Notification.find({
      recipient: new (mongoose.Types.ObjectId as any)(parentUserId),
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return notifications.map((n: any) => ({
      id: n._id,
      title: n.title,
      content: n.content,
      type: n.type || "system",
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));
  }

  /**
   * Retrieves complete authenticated Parent profile, linked wards, and account security status.
   */
  static async getParentProfile(userIdStr: string) {
    if (!userIdStr || !mongoose.isValidObjectId(userIdStr)) {
      throw new ApiError(400, "Valid userId is required", ERROR_CODES.VALIDATION_ERROR);
    }
    const userObjectId = new (mongoose.Types.ObjectId as any)(userIdStr);
    const user = await User.findById(userObjectId).select("+password");
    if (!user || user.isDeleted) {
      throw new ApiError(404, "User account not found", ERROR_CODES.NOT_FOUND);
    }

    const parent = await Parent.findOne({
      user: userObjectId,
      isDeleted: { $ne: true },
    });
    if (!parent) {
      throw new ApiError(404, "Parent profile not found", ERROR_CODES.NOT_FOUND);
    }

    const links = await ParentStudentLink.find({
      parent: parent._id,
      isDeleted: { $ne: true },
    }).populate("student", "firstName lastName studentId status");

    const identities = await UserIdentity.find({
      user: userObjectId,
      isDeleted: { $ne: true },
    });

    return {
      profile: {
        id: parent._id.toString(),
        parentId: parent.parentId,
        firstName: parent.firstName,
        middleName: parent.middleName || "",
        lastName: parent.lastName,
        email: parent.email,
        phone: parent.phone,
        alternatePhone: parent.alternatePhone || "",
        address: parent.address,
        city: parent.city,
        state: parent.state,
        country: parent.country || "USA",
        postalCode: parent.postalCode,
        languagePreference: parent.languagePreference || "en",
        occupation: parent.occupation || "",
        organization: parent.organization || "",
        designation: parent.designation || "",
        annualIncome: parent.annualIncome,
        status: parent.status,
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
      },
      security: {
        email: user.email,
        hasPassword: Boolean(user.password),
        isActive: user.isActive,
        identities: identities.map((id: any) => ({
          provider: id.provider,
          linkedAt: id.createdAt,
        })),
        createdAt: user.createdAt,
      },
      linkedWards: links
        .filter((l) => l.student && !(l.student as any).isDeleted)
        .map((l: any) => ({
          linkId: l._id.toString(),
          studentId: l.student._id.toString(),
          studentCode: l.student.studentId,
          name: `${l.student.firstName} ${l.student.lastName}`,
          relationshipType: l.relationshipType,
          canAccessPortal: l.canAccessPortal,
          status: l.student.status,
        })),
    };
  }

  /**
   * Updates allowable contact and demographic fields of the Parent profile.
   */
  static async updateParentProfile(
    userIdStr: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      alternatePhone?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      occupation?: string;
      organization?: string;
      designation?: string;
      languagePreference?: string;
    }
  ) {
    if (!userIdStr || !mongoose.isValidObjectId(userIdStr)) {
      throw new ApiError(400, "Valid userId is required", ERROR_CODES.VALIDATION_ERROR);
    }
    const userObjectId = new (mongoose.Types.ObjectId as any)(userIdStr);
    const parent = await Parent.findOne({
      user: userObjectId,
      isDeleted: { $ne: true },
    });
    if (!parent) {
      throw new ApiError(404, "Parent profile not found", ERROR_CODES.NOT_FOUND);
    }

    if (data.firstName || data.lastName) {
      const userUpdate: any = {};
      if (data.firstName) userUpdate.firstName = data.firstName.trim();
      if (data.lastName) userUpdate.lastName = data.lastName.trim();
      await User.findByIdAndUpdate(userObjectId, { $set: userUpdate });
      if (data.firstName) parent.firstName = data.firstName.trim();
      if (data.lastName) parent.lastName = data.lastName.trim();
    }

    if (data.phone !== undefined) parent.phone = data.phone.trim();
    if (data.alternatePhone !== undefined) parent.alternatePhone = data.alternatePhone?.trim();
    if (data.address !== undefined) parent.address = data.address.trim();
    if (data.city !== undefined) parent.city = data.city.trim();
    if (data.state !== undefined) parent.state = data.state.trim();
    if (data.country !== undefined) parent.country = data.country.trim();
    if (data.postalCode !== undefined) parent.postalCode = data.postalCode.trim();
    if (data.occupation !== undefined) parent.occupation = data.occupation?.trim();
    if (data.organization !== undefined) parent.organization = data.organization?.trim();
    if (data.designation !== undefined) parent.designation = data.designation?.trim();
    if (data.languagePreference !== undefined) parent.languagePreference = data.languagePreference.trim();

    await parent.save();

    // Synchronize authoritative parent contact details to linked CRM Leads
    const parentFullName = `${parent.firstName} ${parent.lastName}`.trim();
    const leadSyncUpdates: any = {
      fullName: parentFullName,
      parent: parent._id,
    };
    if (parent.phone) leadSyncUpdates.phone = parent.phone;

    await Lead.updateMany(
      {
        $or: [
          { parent: parent._id },
          { email: parent.email }
        ],
        isDeleted: { $ne: true }
      },
      { $set: leadSyncUpdates }
    );
    return this.getParentProfile(userIdStr);
  }

  /**
   * PHASE 6F — COMMUNICATION: Get assigned teachers for the selected child.
   * Derives active instructors strictly from child's active cohort/batch relationships.
   */
  static async getChildTeachers(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);

    // Find active batch enrollments for this student
    const batchStudents = await BatchStudent.find({
      student: student._id,
      status: "active",
      isDeleted: { $ne: true },
    }).lean();

    if (batchStudents.length === 0) {
      return {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentCode: student.studentCode,
        },
        teachers: [],
      };
    }

    const batchIds = batchStudents.map((bs: any) => bs.batch);
    const batches = await Batch.find({
      _id: { $in: batchIds },
      isDeleted: { $ne: true },
    }).lean();

    // Collect primary and assistant teacher IDs from batches
    const teacherMap = new Map<string, any>();

    for (const b of batches) {
      if (b.primaryTeacher) {
        const tId = b.primaryTeacher.toString();
        if (!teacherMap.has(tId)) {
          teacherMap.set(tId, { teacherId: b.primaryTeacher, batchId: b._id, batchName: b.batchName, role: "Primary Instructor" });
        }
      }
      if (b.assistantTeacher) {
        const tId = b.assistantTeacher.toString();
        if (!teacherMap.has(tId)) {
          teacherMap.set(tId, { teacherId: b.assistantTeacher, batchId: b._id, batchName: b.batchName, role: "Assistant Instructor" });
        }
      }
    }

    // Also check BatchTeacher assignment table
    const batchTeachers = await BatchTeacher.find({
      batch: { $in: batchIds },
      status: "active",
      isDeleted: { $ne: true },
    }).lean();

    for (const bt of batchTeachers) {
      const tId = bt.teacher.toString();
      if (!teacherMap.has(tId)) {
        const batch = batches.find((b: any) => b._id.toString() === bt.batch.toString());
        teacherMap.set(tId, {
          teacherId: bt.teacher,
          batchId: bt.batch,
          batchName: batch?.batchName || "Assigned Batch",
          role: bt.role === "primary" ? "Primary Instructor" : bt.role === "assistant" ? "Assistant Instructor" : "Mentor",
        });
      }
    }

    const teacherIds = Array.from(teacherMap.keys()).map((id) => new mongoose.Types.ObjectId(id));
    const teachers = await Teacher.find({
      _id: { $in: teacherIds },
      status: { $in: ["active", "on-leave"] },
      isDeleted: { $ne: true },
    }).lean();

    const resultTeachers = teachers.map((t: any) => {
      const meta = teacherMap.get(t._id.toString());
      return {
        _id: t._id,
        firstName: t.firstName,
        lastName: t.lastName,
        designation: t.designation || "Instructor",
        department: t.department || "Faculty",
        batchId: meta?.batchId,
        batchName: meta?.batchName,
        role: meta?.role,
      };
    });

    return {
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentCode: student.studentCode,
      },
      teachers: resultTeachers,
    };
  }

  /**
   * PHASE 6F — COMMUNICATION: Get message thread between Parent and Teacher for a specific child.
   */
  static async getChildMessages(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    teacherIdStr?: string
  ) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const teacherData = await this.getChildTeachers(parentId, studentIdStr);

    if (teacherData.teachers.length === 0) {
      return {
        student: teacherData.student,
        teachers: [],
        activeTeacher: null,
        messages: [],
      };
    }

    // Determine target teacher
    let targetTeacher = teacherData.teachers[0];
    if (teacherIdStr && mongoose.isValidObjectId(teacherIdStr)) {
      const found = teacherData.teachers.find((t: any) => t._id.toString() === teacherIdStr);
      if (!found) {
        throw new ApiError(
          403,
          "Access denied: Teacher is not assigned to an active cohort for this student",
          ERROR_CODES.FORBIDDEN
        );
      }
      targetTeacher = found;
    }

    // Retrieve child-scoped message thread strictly between this parent, teacher, and student
    const messages = await ParentTeacherMessage.find({
      parent: parentId,
      student: student._id,
      teacher: targetTeacher._id,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .lean();

    return {
      student: teacherData.student,
      teachers: teacherData.teachers,
      activeTeacher: targetTeacher,
      messages: messages.map((m: any) => ({
        _id: m._id,
        senderRole: m.senderRole,
        subject: m.subject || "",
        message: m.message,
        isRead: m.isRead,
        readAt: m.readAt,
        status: m.status,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * PHASE 6F — COMMUNICATION: Send a message to an assigned teacher for a specific child.
   */
  static async sendChildMessage(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    payload: { teacherId?: string; subject?: string; message: string },
    userObjectId: mongoose.Types.ObjectId
  ) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const teacherData = await this.getChildTeachers(parentId, studentIdStr);

    if (teacherData.teachers.length === 0) {
      throw new ApiError(
        400,
        "Cannot send message: This student has no active enrolled batch with an assigned instructor",
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (!payload.message || !payload.message.trim()) {
      throw new ApiError(400, "Message text is required", ERROR_CODES.VALIDATION_ERROR);
    }

    let targetTeacher = teacherData.teachers[0];
    if (payload.teacherId) {
      const found = teacherData.teachers.find((t: any) => t._id.toString() === payload.teacherId);
      if (!found) {
        throw new ApiError(
          403,
          "Access denied: Specified instructor is not assigned to this student",
          ERROR_CODES.FORBIDDEN
        );
      }
      targetTeacher = found;
    }

    // Create child-scoped message
    const newMsg = await ParentTeacherMessage.create({
      parent: parentId,
      teacher: targetTeacher._id,
      student: student._id,
      batch: targetTeacher.batchId,
      senderRole: "parent",
      senderUser: userObjectId,
      subject: payload.subject?.trim() || `Inquiry regarding ${student.firstName}`,
      message: payload.message.trim(),
      isRead: false,
      status: "sent",
    });

    // Notify Teacher via Notification system
    const teacherDoc: any = await Teacher.findById(targetTeacher._id).lean();
    if (teacherDoc && teacherDoc.user) {
      const parentUser: any = await User.findById(userObjectId).lean();
      const parentName = parentUser ? `${parentUser.firstName} ${parentUser.lastName}` : "Parent";

      await Notification.create({
        recipient: teacherDoc.user,
        sender: userObjectId,
        title: `New Message from Parent (${parentName})`,
        content: `Parent ${parentName} sent an inquiry regarding student ${student.firstName} ${student.lastName} in ${targetTeacher.batchName || "cohort"}: "${payload.message.trim().substring(0, 100)}"`,
        eventSource: "reports",
        status: "active",
      });
    }

    return {
      _id: newMsg._id,
      senderRole: newMsg.senderRole,
      subject: newMsg.subject,
      message: newMsg.message,
      isRead: newMsg.isRead,
      status: newMsg.status,
      createdAt: newMsg.createdAt,
    };
  }

  /**
   * PHASE 6F — COMMUNICATION: Mark message as read by parent.
   */
  static async markChildMessageRead(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    messageIdStr: string
  ) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);

    if (!mongoose.isValidObjectId(messageIdStr)) {
      throw new ApiError(400, "Invalid Message ID", ERROR_CODES.VALIDATION_ERROR);
    }

    const message = await ParentTeacherMessage.findOne({
      _id: new mongoose.Types.ObjectId(messageIdStr),
      parent: parentId,
      student: student._id,
      isDeleted: { $ne: true },
    });

    if (!message) {
      throw new ApiError(404, "Message not found or does not belong to this child", ERROR_CODES.NOT_FOUND);
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      message.status = "read";
      await message.save();
    }

    return { success: true, messageId: message._id, isRead: message.isRead, readAt: message.readAt };
  }
  /**
   * Figma/Mobile: getChildSchedule
   */
  static async getChildSchedule(parentId: mongoose.Types.ObjectId, studentIdStr: string, fromDate?: Date, toDate?: Date) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    
    const batchStudents = await BatchStudent.find({ student: student._id, status: "active", isDeleted: { $ne: true } });
    const batchIds = batchStudents.map(b => b.batch);
    
    const now = new Date();
    const query: any = {
      batch: { $in: batchIds },
      status: {
        $nin: ["cancelled", "Cancelled", "CANCELLED", "archived", "Archived", "completed", "Completed", "missed", "Missed"],
      },
      isDeleted: { $ne: true },
    };
    if (fromDate || toDate) {
      query.startDate = {};
      if (fromDate) query.startDate.$gte = fromDate;
      if (toDate) query.startDate.$lte = toDate;
    } else {
      // Default to upcoming / ongoing classes (from 1 hour ago onwards)
      query.startDate = { $gte: new Date(now.getTime() - 60 * 60 * 1000) };
    }
    
    const liveClasses = await LiveClass.find(query)
      .sort({ startDate: 1 })
      .populate("teacher", "firstName lastName designation")
      .populate("course", "courseName courseCode")
      .populate("batch", "batchName batchCode");
      
    return liveClasses.map(lc => {
      const teacherName = (lc.teacher as any)
        ? `${(lc.teacher as any).firstName} ${(lc.teacher as any).lastName}`.trim()
        : undefined;
      const courseName = (lc.course as any)?.courseName;
      const batchName = (lc.batch as any)?.batchName;

      return {
        id: lc._id.toString(),
        _id: lc._id.toString(),
        classId: lc._id.toString(),
        classCode: lc.classCode,
        classTitle: lc.classTitle,
        title: lc.classTitle,
        course: courseName,
        courseName: courseName,
        batch: batchName,
        batchName: batchName,
        teacher: teacherName,
        instructor: teacherName,
        startDate: lc.startDate,
        startAt: lc.startDate,
        endDate: lc.endDate,
        endAt: lc.endDate,
        duration: lc.duration,
        status: lc.status,
        joinable: ["scheduled", "in-progress", "live"].includes((lc.status || "").toLowerCase()),
        classType: "live",
      };
    });
  }

  /**
   * Figma/Mobile: getChildClassSummary
   */
  static async getChildClassSummary(parentId: mongoose.Types.ObjectId, studentIdStr: string, classIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    
    if (!mongoose.isValidObjectId(classIdStr)) throw new ApiError(400, "Invalid Class ID", ERROR_CODES.VALIDATION_ERROR);
    
    const liveClass = await LiveClass.findById(classIdStr)
      .populate("teacher", "firstName lastName")
      .populate("course", "courseName")
      .populate("batch", "batchName");
      
    if (!liveClass || liveClass.isDeleted) throw new ApiError(404, "Class not found", ERROR_CODES.NOT_FOUND);
    
    // Verify enrollment
    const isEnrolled = await BatchStudent.exists({ student: student._id, batch: liveClass.batch, status: "active", isDeleted: { $ne: true } });
    if (!isEnrolled) throw new ApiError(403, "Not authorized to access this class summary", ERROR_CODES.FORBIDDEN);
    
    const attendance = await Attendance.findOne({ liveClass: liveClass._id, student: student._id });
    
    return {
      classId: liveClass._id,
      title: liveClass.title,
      program: (liveClass.course as any)?.courseName,
      module: liveClass.description, // using description as proxy for topic if missing
      date: liveClass.startDate,
      startTime: liveClass.startDate,
      endTime: liveClass.endDate,
      duration: liveClass.duration,
      teacher: (liveClass.teacher as any) ? `${(liveClass.teacher as any).firstName} ${(liveClass.teacher as any).lastName}` : undefined,
      status: liveClass.status,
      attendanceStatus: attendance?.status || "absent",
      joinAvailability: liveClass.status === "in-progress"
    };
  }

  /**
   * Figma/Mobile: getChildProgram
   */
  static async getChildProgram(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    
    const batchStudents = await BatchStudent.find({ student: student._id, status: "active", isDeleted: { $ne: true } })
      .populate({
        path: "batch",
        populate: [
          {
            path: "course",
            select: "courseName courseCode shortDescription thumbnail outcomes level duration durationUnit"
          },
          {
            path: "primaryTeacher",
            select: "firstName lastName"
          }
        ]
      });
      
    if (batchStudents.length === 0) return null;
    
    // Pick primary active program
    const activeProgram = batchStudents[0];
    const batch = activeProgram.batch as any;
    const course = batch.course as any;
    
    if (!course) return null;
    
    const teacher = batch.primaryTeacher as any;
    const instructor = teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : undefined;

    // Authoritative single source of truth for course progress
    const progress = await ProgressService.getStudentCourseProgress(student._id, course._id);

    const assessments = await Assessment.find({ batch: batch._id, status: { $in: ['published', 'completed'] } });
    const totalAssessments = assessments.length;
    const assessmentResults = await AssessmentResult.find({ student: student._id, assessment: { $in: assessments.map(a => a._id) } });
    const completedAssessments = assessmentResults.length;
    
    const assignments = await Assignment.find({ batch: batch._id, isDeleted: { $ne: true } });
    const totalAssignments = assignments.length;
    const submissions = await AssignmentSubmission.find({ student: student._id, assignment: { $in: assignments.map(a => a._id) } });
    const completedAssignments = submissions.filter(s => s.status === "submitted" || s.status === "graded").length;
    
    const programInfo = {
      _id: course._id,
      courseId: course._id,
      programId: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.shortDescription,
      thumbnail: course.thumbnail,
      level: course.level,
      duration: course.duration ? `${course.duration} ${course.durationUnit || "weeks"}` : "—",
      batchId: batch._id,
      batchName: batch.batchName,
      instructor,
      teacher: instructor,
      progress,
      skillsInFocus: course.outcomes?.skills || [],
      totalAssignments,
      completedAssignments,
      totalAssessments,
      completedAssessments
    };

    return {
      ...programInfo,
      activeProgram: programInfo
    };
  }

  /**
   * Figma/Mobile: getChildProgress
   */
  static async getChildProgress(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    
    const batchStudents = await BatchStudent.find({ student: student._id, status: "active", isDeleted: { $ne: true } });
    const batchIds = batchStudents.map(b => b.batch);
    
    // Real data calculation
    const assignments = await Assignment.find({ batch: { $in: batchIds }, isDeleted: { $ne: true } });
    const totalAssignments = assignments.length;
    
    const submissions = await AssignmentSubmission.find({ student: student._id, assignment: { $in: assignments.map(a => a._id) } });
    const completedAssignments = submissions.filter(s => s.status === "submitted" || s.status === "graded").length;
    
    const classes = await LiveClass.find({ batch: { $in: batchIds }, status: "completed", isDeleted: { $ne: true } });
    const totalCompletedClasses = classes.length;
    
    const attendance = await Attendance.find({ student: student._id, liveClass: { $in: classes.map(c => c._id) }, status: "present" });
    const attendedClasses = attendance.length;
    
    const { Assessment } = require("../../models/assessment.model");
    const { AssessmentResult } = require("../../models/assessment-result.model");
    const assessments = await Assessment.find({ batch: { $in: batchIds }, status: "published" });
    const totalAssessments = assessments.length;
    const assessmentResults = await AssessmentResult.find({ student: student._id, assessment: { $in: assessments.map((a: any) => a._id) } });
    const completedAssessments = assessmentResults.filter((r: any) => r.status === "completed" || r.status === "graded").length;
    
    const overallCompletion = totalAssignments + totalCompletedClasses + totalAssessments > 0 
      ? Math.round(((completedAssignments + attendedClasses + completedAssessments) / (totalAssignments + totalCompletedClasses + totalAssessments)) * 100) 
      : 0;
      
    return {
      overallCompletion,
      assessmentCompletion: {
        total: totalAssessments,
        completed: completedAssessments,
        percentage: totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0
      },
      assignmentCompletion: {
        total: totalAssignments,
        completed: completedAssignments,
        percentage: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
      },
      attendanceSummary: {
        totalClasses: totalCompletedClasses,
        attended: attendedClasses,
        percentage: totalCompletedClasses > 0 ? Math.round((attendedClasses / totalCompletedClasses) * 100) : 0
      }
    };
  }

  /**
   * Figma/Mobile: getChildSkills
   */
  static async getChildSkills(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    
    const batchStudents = await BatchStudent.find({ student: student._id, status: "active", isDeleted: { $ne: true } })
      .populate({ path: "batch", populate: { path: "course", select: "outcomes" } });
      
    const skills = new Set<string>();
    for (const bs of batchStudents) {
      const course = (bs.batch as any)?.course;
      if (course?.outcomes?.skills) {
        course.outcomes.skills.forEach((s: string) => skills.add(s));
      }
    }
    
    return {
      skills: Array.from(skills),
      source: "course_outcomes"
    };
  }

  /**
   * Figma/Mobile: getChildCertificates
   */
  static async getChildCertificates(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    
    // Note: Depends on Certificate.model holding student reference
    const certificates = await Certificate.find({ student: student._id, isDeleted: { $ne: true } })
      .populate("course", "courseName")
      .populate("batch", "batchName")
      .sort({ issueDate: -1 });
      
    return certificates.map(c => ({
      certificateId: c._id,
      certificateNumber: c.certificateNumber,
      course: (c.course as any)?.courseName,
      batch: (c.batch as any)?.batchName,
      issueDate: c.issueDate,
      status: c.status,
      downloadUrl: c.pdfUrl || null
    }));
  }

  /**
   * Figma/Mobile: getChildInvoices
   */
  static async getChildInvoices(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    
    const invoices = await Invoice.find({ student: student._id, isDeleted: { $ne: true } })
      .sort({ issueDate: -1 });
      
    return invoices.map(inv => ({
      invoiceId: inv._id,
      number: inv.invoiceNumber,
      baseAmount: inv.baseAmount || 0,
      taxAmount: inv.taxAmount || 0,
      discountAmount: inv.discountAmount || 0,
      scholarshipAmount: inv.scholarshipAmount || 0,
      totalAmount: inv.totalAmount || 0,
      outstandingAmount: inv.outstandingAmount || 0,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate
    }));
  }

  /**
   * Retrieves authoritative conversion & enrollment offer for a child.
   * Resolves Student, Course, completed Demo, and calculated FeePlan/Invoice.
   */
  static async getEnrollmentOffer(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);

    // 1. Check for Existing Enrollment (if already created by counsellor/admin)
    let existingEnrollment = await Enrollment.findOne({
      student: student._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    // 2. Check for Lead (strictly scoped to this child)
    const parentDoc = await Parent.findById(parentId);
    const lead = await Lead.findOne({
      student: student._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    // 3. Resolve Target Course
    let course: any = null;
    if (existingEnrollment?.course) {
      course = await Course.findById(existingEnrollment.course);
    } else if (lead?.course) {
      course = await Course.findById(lead.course);
    } else if (lead?.interestedCourse) {
      course = await Course.findOne({
        $or: [
          { courseName: new RegExp(`^${lead.interestedCourse.replace(/[-_]/g, " ")}$`, "i") },
          { slug: lead.interestedCourse.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          { courseCode: lead.interestedCourse.toUpperCase() },
        ],
        status: "published",
        isDeleted: { $ne: true },
      });
    }

    // 4. Check for DemoSession (strictly scoped to this student and course)
    let demo: any = null;
    if (course) {
      demo = await DemoSession.findOne({
        student: student._id,
        $or: [
          { course: course._id },
          ...(course.courseName ? [{ interestedCourse: course.courseName }] : []),
        ],
        status: "completed",
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });

      if (!demo) {
        demo = await DemoSession.findOne({
          student: student._id,
          $or: [
            { course: course._id },
            ...(course.courseName ? [{ interestedCourse: course.courseName }] : []),
          ],
          isDeleted: { $ne: true },
        }).sort({ createdAt: -1 });
      }
    }

    if (!course) {
      course = await Course.findOne({ status: "published", isDeleted: { $ne: true } });
    }

    if (!course) {
      throw new ApiError(404, "No active course available for enrollment", ERROR_CODES.NOT_FOUND);
    }

    // 4. Resolve FeePlan & Calculate Fees
    const feePlan = await FeePlan.findOne({ course: course._id, isDeleted: { $ne: true } });
    let baseAmount = 0;
    let registrationFee = 0;
    let materialFee = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    if (feePlan) {
      baseAmount = feePlan.baseFee;
      registrationFee = feePlan.registrationFee || 0;
      materialFee = feePlan.materialFee || 0;
      const subtotal = FinanceCalculationService.add(FinanceCalculationService.add(baseAmount, registrationFee), materialFee);
      taxAmount = FinanceCalculationService.multiply(subtotal, (feePlan.tax || 0) / 100);
      totalAmount = FinanceCalculationService.add(subtotal, taxAmount);
    } else {
      const priceCents = (course.pricing?.discountPrice || course.pricing?.price || 500) * 100;
      const taxRate = course.pricing?.taxPercentage || 10;
      baseAmount = priceCents;
      taxAmount = Math.round((priceCents * taxRate) / 100);
      totalAmount = baseAmount + taxAmount;
    }

    // 5. Check for Existing Enrollment
    if (!existingEnrollment || existingEnrollment.course?.toString() !== course._id.toString()) {
      existingEnrollment = await Enrollment.findOne({
        student: student._id,
        course: course._id,
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });
    }

    let existingInvoice = null;
    let checkoutToken = null;
    let checkoutUrl = null;

    if (existingEnrollment) {
      existingInvoice = await Invoice.findOne({
        enrollment: existingEnrollment._id,
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });

      if (existingInvoice && parentDoc?.email) {
        checkoutToken = CheckoutTokenService.signCheckoutToken({
          enrollmentId: existingEnrollment._id.toString(),
          invoiceId: existingInvoice._id.toString(),
          email: parentDoc.email,
          studentId: student._id.toString(),
          parentId: parentId.toString(),
          courseId: course._id.toString(),
        });
        checkoutUrl = `/checkout?session=${encodeURIComponent(checkoutToken)}`;
      }
    }

    // Teacher from demo
    let teacherInfo = null;
    if (demo?.teacher) {
      const teacherDoc = await Teacher.findById(demo.teacher).select("firstName lastName bio");
      if (teacherDoc) {
        teacherInfo = {
          id: teacherDoc._id,
          name: `${teacherDoc.firstName} ${teacherDoc.lastName}`.trim(),
        };
      }
    }

    return {
      eligible: demo?.status === "completed",
      demoStatus: demo?.status || "none",
      child: {
        id: student._id.toString(),
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`.trim(),
        fullName: `${student.firstName} ${student.lastName}`.trim(),
      },
      course: {
        id: course._id.toString(),
        courseName: course.courseName,
        courseCode: course.courseCode,
        slug: course.slug,
        duration: course.duration || 12,
        durationWeeks: course.durationWeeks || course.duration || 12,
        durationUnit: course.durationUnit || "weeks",
        deliveryMode: course.deliveryMode || "Live Interactive Online",
        currency: course.pricing?.currency || "USD",
      },
      demo: demo ? {
        id: demo._id.toString(),
        demoCode: demo.demoCode,
        status: demo.status,
        scheduledStart: demo.scheduledStart,
        teacher: teacherInfo,
        facultyName: teacherInfo?.name || "Assigned Faculty",
      } : null,
      fees: {
        baseFee: baseAmount,
        registrationFee,
        materialFee,
        tax: taxAmount,
        taxAmount,
        discount: 0,
        discountAmount: 0,
        totalPayable: existingInvoice ? existingInvoice.totalAmount : totalAmount,
        totalAmount: existingInvoice ? existingInvoice.totalAmount : totalAmount,
        outstandingAmount: existingInvoice ? existingInvoice.outstandingAmount : totalAmount,
        currency: course.pricing?.currency || "USD",
      },
      enrollment: existingEnrollment ? {
        id: existingEnrollment._id.toString(),
        enrollmentNumber: existingEnrollment.enrollmentNumber,
        status: existingEnrollment.status,
      } : null,
      invoice: existingInvoice ? {
        id: existingInvoice._id.toString(),
        invoiceNumber: existingInvoice.invoiceNumber,
        status: existingInvoice.status,
        totalAmount: existingInvoice.totalAmount,
        outstandingAmount: existingInvoice.outstandingAmount,
      } : null,
      checkoutToken,
      checkoutUrl,
    };
  }

  /**
   * Initiates authoritative Enrollment & Invoice for a child, returning checkout session URL.
   * Guarantees idempotency: reuses existing waiting-payment enrollment/invoice without creating duplicates.
   * Enforces Demo Completion Gate: child must have completed demo session.
   */
  static async initiateChildEnrollment(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    courseIdStr?: string
  ) {
    const { student } = await this.authorizeChildAccess(parentId, studentIdStr);
    const parentDoc = await Parent.findById(parentId);
    if (!parentDoc) {
      throw new ApiError(404, "Parent not found", ERROR_CODES.NOT_FOUND);
    }

    // 1. Resolve Target Course
    let course: any = null;
    if (courseIdStr && mongoose.isValidObjectId(courseIdStr)) {
      course = await Course.findById(courseIdStr);
    }

    // Check if an existing enrollment for this student already points to a course
    let existingEnrollment = null;
    if (!course) {
      existingEnrollment = await Enrollment.findOne({
        student: student._id,
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });
      if (existingEnrollment?.course) {
        course = await Course.findById(existingEnrollment.course);
      }
    }

    if (!course) {
      const lead = await Lead.findOne({
        student: student._id,
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });
      if (lead?.course) {
        course = await Course.findById(lead.course);
      } else if (lead?.interestedCourse) {
        course = await Course.findOne({
          $or: [
            { courseName: new RegExp(`^${lead.interestedCourse.replace(/[-_]/g, " ")}$`, "i") },
            { slug: lead.interestedCourse.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
            { courseCode: lead.interestedCourse.toUpperCase() },
          ],
          status: "published",
          isDeleted: { $ne: true },
        });
      }
    }

    if (!course) {
      course = await Course.findOne({ status: "published", isDeleted: { $ne: true } });
    }

    if (!course) {
      throw new ApiError(404, "No active course found for enrollment", ERROR_CODES.NOT_FOUND);
    }

    // Check for existing enrollment specifically for this student and course
    if (!existingEnrollment || existingEnrollment.course?.toString() !== course._id.toString()) {
      existingEnrollment = await Enrollment.findOne({
        student: student._id,
        course: course._id,
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });
    }

    // Diagnostic validation: Ensure existing enrollment belongs strictly to this student
    if (existingEnrollment && existingEnrollment.student.toString() !== student._id.toString()) {
      throw new ApiError(400, "Existing enrollment conflicts with the requested child.", ERROR_CODES.VALIDATION_ERROR);
    }

    // 2. Enforce Demo Completion Gate (strictly scoped to this child and course)
    const demoQuery = {
      student: student._id,
      $or: [
        { course: course._id },
        ...(course.courseName ? [{ interestedCourse: course.courseName }] : []),
      ],
      isDeleted: { $ne: true },
    };

    let demo = await DemoSession.findOne({
      ...demoQuery,
      status: "completed",
    }).sort({ createdAt: -1 });

    if (!demo) {
      // Check if any demo session exists for this child & course (regardless of status) to inspect
      demo = await DemoSession.findOne(demoQuery).sort({ createdAt: -1 });
    }

    if (!demo || demo.status !== "completed") {
      throw new ApiError(
        400,
        "Cannot initiate enrollment: Child has not completed a demo session. Enrollment is unlocked only upon demo completion.",
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 3. Find or Create Authoritative Enrollment (Waiting-Payment)
    // Reuse existing enrollment if available in payable statuses
    let enrollment = existingEnrollment && ["waiting-payment", "confirmed", "batch-assigned", "learning-started", "pending"].includes(existingEnrollment.status)
      ? existingEnrollment
      : null;

    let isNewEnrollment = false;
    if (!enrollment) {
      isNewEnrollment = true;
      let nextEnrNum = (await Enrollment.countDocuments()) + 1;
      let enrollmentNumber = `ENR-${String(nextEnrNum).padStart(5, "0")}`;
      while (await Enrollment.exists({ enrollmentNumber })) {
        nextEnrNum++;
        enrollmentNumber = `ENR-${String(nextEnrNum).padStart(5, "0")}`;
      }

      // Resolve linked lead if available (strictly for this student)
      const linkedLead = await Lead.findOne({
        student: student._id,
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });

      enrollment = await Enrollment.create({
        enrollmentNumber,
        student: student._id,
        course: course._id,
        lead: linkedLead?._id,
        academicSession: new Date().getFullYear().toString(),
        enrollmentDate: new Date(),
        status: "waiting-payment",
        notes: `Initiated by Parent (${parentDoc.email}) for child ${student.firstName} ${student.lastName}`,
      });
    }

    // If enrollment is already confirmed, return it directly
    if (["confirmed", "batch-assigned", "learning-started"].includes(enrollment.status)) {
      return {
        success: true,
        enrollmentId: enrollment._id.toString(),
        enrollmentNumber: enrollment.enrollmentNumber,
        status: enrollment.status,
        isConfirmed: true,
        message: "Enrollment is already confirmed for this course.",
      };
    }

    // 4. Find or Create Authoritative Invoice
    let invoice = await Invoice.findOne({
      enrollment: enrollment._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    if (!invoice) {
      const feePlan = await FeePlan.findOne({ course: course._id, isDeleted: { $ne: true } });
      let baseAmount = 0;
      let taxAmount = 0;
      let totalAmount = 0;

      if (feePlan) {
        const basePlusReg = FinanceCalculationService.add(feePlan.baseFee, feePlan.registrationFee || 0);
        const subtotal = FinanceCalculationService.add(basePlusReg, feePlan.materialFee || 0);
        taxAmount = FinanceCalculationService.multiply(subtotal, (feePlan.tax || 0) / 100);
        totalAmount = FinanceCalculationService.add(subtotal, taxAmount);
        baseAmount = subtotal;
      } else {
        const priceCents = (course.pricing?.discountPrice || course.pricing?.price || 500) * 100;
        const taxRate = course.pricing?.taxPercentage || 10;
        baseAmount = priceCents;
        taxAmount = Math.round((priceCents * taxRate) / 100);
        totalAmount = baseAmount + taxAmount;
      }

      let nextInvNum = (await Invoice.countDocuments()) + 1;
      let invoiceNumber = `INV-${String(nextInvNum).padStart(6, "0")}`;
      while (await Invoice.exists({ invoiceNumber })) {
        nextInvNum++;
        invoiceNumber = `INV-${String(nextInvNum).padStart(6, "0")}`;
      }

      invoice = await Invoice.create({
        invoiceNumber,
        enrollment: enrollment._id,
        student: student._id,
        course: course._id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        baseAmount,
        taxAmount,
        discountAmount: 0,
        scholarshipAmount: 0,
        totalAmount,
        outstandingAmount: totalAmount,
        status: "issued",
      });
    }

    // 5. Update CRM Lead to "enrollment_pending" if linked (strictly scoped to this child)
    if (enrollment.lead) {
      await Lead.findByIdAndUpdate(enrollment.lead, {
        status: "enrollment_pending",
        student: student._id,
        parent: parentId,
      });
    } else {
      await Lead.findOneAndUpdate(
        {
          student: student._id,
          isDeleted: { $ne: true },
          status: { $in: ["demo_scheduled", "demo_completed", "qualified", "new"] },
        },
        {
          status: "enrollment_pending",
          student: student._id,
          parent: parentId,
        }
      );
    }

    // 6. Sign Checkout Session Token (explicitly child-bound claims)
    const checkoutToken = CheckoutTokenService.signCheckoutToken({
      enrollmentId: enrollment._id.toString(),
      invoiceId: invoice._id.toString(),
      email: parentDoc.email,
      studentId: student._id.toString(),
      parentId: parentId.toString(),
      courseId: course._id.toString(),
    });

    const checkoutUrl = `/checkout?session=${encodeURIComponent(checkoutToken)}`;

    // 7. Dispatch enrollment offer email job via JobEngine (idempotent, Phase 3O)
    const childFullName = `${student.firstName} ${student.lastName}`.trim();
    const parentFullName = `${parentDoc.firstName} ${parentDoc.lastName}`.trim();

    await JobEngineService.scheduleJob({
      jobType: "enrollment.offer",
      entityType: "Enrollment",
      entityId: enrollment._id.toString(),
      payload: {
        enrollmentId: enrollment._id.toString(),
        invoiceId: invoice._id.toString(),
        parentEmail: parentDoc.email,
        parentName: parentFullName,
        childName: childFullName,
        courseName: course.courseName,
        totalAmount: invoice.totalAmount,
        currency: "USD",
        checkoutUrl,
      },
      idempotencyKey: `enrollment-offer-${enrollment._id}`,
      priority: "high",
    });

    return {
      success: true,
      enrollmentId: enrollment._id.toString(),
      enrollmentNumber: enrollment.enrollmentNumber,
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      courseId: course._id.toString(),
      courseName: course.courseName,
      totalAmount: invoice.totalAmount,
      outstandingAmount: invoice.outstandingAmount,
      currency: "USD",
      checkoutToken,
      checkoutUrl,
      isNewEnrollment,
      isConfirmed: false,
    };
  }

  /**
   * Retrieves single child profile linked to this parent.
   * Enforces 403 authorization if child is not linked to parent.
   */
  static async getChild(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    if (!mongoose.isValidObjectId(studentIdStr)) {
      throw new ApiError(400, "Invalid Student ID", ERROR_CODES.VALIDATION_ERROR);
    }
    const studentId = new mongoose.Types.ObjectId(studentIdStr);

    const link = await ParentStudentLink.findOne({
      parent: parentId,
      student: studentId,
      isDeleted: { $ne: true },
    }).populate<{ student: any }>("student");

    if (!link) {
      const existsGlobally = await Student.findOne({ _id: studentId, isDeleted: { $ne: true } });
      if (existsGlobally) {
        throw new ApiError(403, "Access denied: child is not linked to your account", ERROR_CODES.FORBIDDEN);
      }
      throw new ApiError(404, "Child profile not found", ERROR_CODES.NOT_FOUND);
    }

    const student = link.student;
    if (!student || student.isDeleted) {
      throw new ApiError(404, "Student record not found", ERROR_CODES.NOT_FOUND);
    }

    return {
      linkId: link._id,
      studentId: student._id,
      studentCode: student.studentId,
      firstName: student.firstName,
      middleName: student.middleName || "",
      lastName: student.lastName,
      name: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" "),
      gender: student.gender,
      dob: student.dob,
      age: calculateAge(student.dob),
      phone: student.phone,
      city: student.city || "",
      state: student.state || "",
      country: student.country || "",
      schoolCollege: student.schoolCollege || "",
      relationshipType: link.relationshipType,
      isCustodial: link.isCustodial,
      isEmergencyContact: link.isEmergencyContact,
      canAccessPortal: link.canAccessPortal,
      status: student.status,
    };
  }

  /**
   * Updates a linked child's profile details.
   * Enforces 403 authorization, input validation (DOB, names), field whitelisting,
   * and synchronizes the student User record name if present.
   */
  static async updateChild(
    parentId: mongoose.Types.ObjectId,
    studentIdStr: string,
    data: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      relationshipType?: string;
      gender?: string;
      dob?: string | Date;
      phone?: string;
      city?: string;
      state?: string;
      country?: string;
      schoolCollege?: string;
    }
  ) {
    if (!mongoose.isValidObjectId(studentIdStr)) {
      throw new ApiError(400, "Invalid Student ID", ERROR_CODES.VALIDATION_ERROR);
    }
    const studentId = new mongoose.Types.ObjectId(studentIdStr);

    const link = await ParentStudentLink.findOne({
      parent: parentId,
      student: studentId,
      isDeleted: { $ne: true },
    }).populate<{ student: any }>("student");

    if (!link) {
      const existsGlobally = await Student.findOne({ _id: studentId, isDeleted: { $ne: true } });
      if (existsGlobally) {
        throw new ApiError(403, "Access denied: child is not linked to your account", ERROR_CODES.FORBIDDEN);
      }
      throw new ApiError(404, "Child profile not found", ERROR_CODES.NOT_FOUND);
    }

    const student = link.student;
    if (!student || student.isDeleted) {
      throw new ApiError(404, "Student record not found", ERROR_CODES.NOT_FOUND);
    }

    const updateFields: Record<string, any> = {};

    if (data.firstName !== undefined) {
      if (!data.firstName.trim()) {
        throw new ApiError(400, "First name cannot be empty", ERROR_CODES.VALIDATION_ERROR);
      }
      updateFields.firstName = data.firstName.trim();
    }

    if (data.middleName !== undefined) {
      updateFields.middleName = data.middleName.trim();
    }

    if (data.lastName !== undefined) {
      if (!data.lastName.trim()) {
        throw new ApiError(400, "Last name cannot be empty", ERROR_CODES.VALIDATION_ERROR);
      }
      updateFields.lastName = data.lastName.trim();
    }

    if (data.dob !== undefined) {
      if (data.dob) {
        const parsedDob = new Date(data.dob);
        if (isNaN(parsedDob.getTime())) {
          throw new ApiError(400, "Invalid Date of Birth", ERROR_CODES.VALIDATION_ERROR);
        }
        if (parsedDob > new Date()) {
          throw new ApiError(400, "Date of Birth cannot be in the future", ERROR_CODES.VALIDATION_ERROR);
        }
        updateFields.dob = parsedDob;
      } else {
        updateFields.dob = null;
      }
    }

    if (data.gender !== undefined) {
      const g = (data.gender || "").toLowerCase().trim();
      if (["male", "female", "other", "prefer-not-to-say"].includes(g)) {
        updateFields.gender = g;
      }
    }

    if (data.phone !== undefined) updateFields.phone = data.phone.trim();
    if (data.city !== undefined) updateFields.city = data.city.trim();
    if (data.state !== undefined) updateFields.state = data.state.trim();
    if (data.country !== undefined) updateFields.country = data.country.trim();
    if (data.schoolCollege !== undefined) updateFields.schoolCollege = data.schoolCollege.trim();

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: updateFields },
      { new: true }
    );

    // Keep student's authenticated user name in sync if exists (NOT the parent's user!)
    if (updatedStudent.user && (updateFields.firstName || updateFields.lastName)) {
      await User.findByIdAndUpdate(updatedStudent.user, {
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
      });
    }

    if (data.relationshipType) {
      const rel = data.relationshipType.toLowerCase().trim();
      const validRel = ["father", "mother", "guardian", "foster", "other"];
      if (validRel.includes(rel)) {
        link.relationshipType = rel;
        await link.save();
      }
    }

    return {
      linkId: link._id,
      studentId: updatedStudent._id,
      studentCode: updatedStudent.studentId,
      firstName: updatedStudent.firstName,
      middleName: updatedStudent.middleName || "",
      lastName: updatedStudent.lastName,
      name: [updatedStudent.firstName, updatedStudent.middleName, updatedStudent.lastName].filter(Boolean).join(" "),
      gender: updatedStudent.gender,
      dob: updatedStudent.dob,
      age: calculateAge(updatedStudent.dob),
      phone: updatedStudent.phone,
      city: updatedStudent.city || "",
      state: updatedStudent.state || "",
      country: updatedStudent.country || "",
      schoolCollege: updatedStudent.schoolCollege || "",
      relationshipType: link.relationshipType,
      isCustodial: link.isCustodial,
      isEmergencyContact: link.isEmergencyContact,
      canAccessPortal: link.canAccessPortal,
      status: updatedStudent.status,
    };
  }

  /**
   * Removes a child from the parent's account by unlinking them.
   * Does NOT globally delete the student.
   */
  static async removeChild(parentId: mongoose.Types.ObjectId, studentIdStr: string) {
    if (!mongoose.isValidObjectId(studentIdStr)) {
      throw new ApiError(400, "Invalid Student ID", ERROR_CODES.VALIDATION_ERROR);
    }
    const studentId = new (mongoose.Types.ObjectId as any)(studentIdStr);

    // Verify link exists
    const link = await ParentStudentLink.findOne({
      parent: parentId,
      student: studentId,
      isDeleted: { $ne: true }
    });

    if (!link) {
      throw new ApiError(404, "Child profile not found or not linked to your account.", ERROR_CODES.NOT_FOUND);
    }

    // Safely remove the link
    await ParentStudentLink.deleteOne({ _id: link._id });

    return { success: true, message: "Child removed successfully" };
  }
}

