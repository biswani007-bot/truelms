/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Enrollment } from "../../models/enrollment.model";
import { Student } from "../../models/student.model";
import { User } from "../../models/user.model";
import { Role } from "../../models/role.model";
import { Batch } from "../../models/batch.model";
import { AssignmentService } from "../batch/assignment.service";
import { EmailService } from "../email/email.service";
import { AuditService } from "../audit/audit.service";
import { logger } from "../../utils/logger";
import { DateHelper } from "../../helpers/date";

export class EnrollmentAutomationService {
  /**
   * Automate post-enrollment tasks upon confirmation:
   * 1. Check idempotency — skip if already batch-assigned.
   * 2. Finalize Student User account with activation token if not existing.
   * 3. Assign Student to active Course Batch via the existing AssignmentService
   *    (respects capacity, rules, and waiting list).
   * 4. Update Enrollment status to batch-assigned.
   * 5. Update Student status to active.
   * 6. Dispatch Welcome Email with activation link.
   * 7. Create audit trail.
   */
  static async handleEnrollmentConfirmed(enrollmentId: string): Promise<any> {
    const enrollment = await Enrollment.findById(enrollmentId).populate("student").populate("course");
    if (!enrollment) {
      throw new Error(`Enrollment ${enrollmentId} not found`);
    }

    // Idempotency: skip if already processed
    if (enrollment.status === "batch-assigned" || enrollment.status === "learning-started" || enrollment.status === "completed") {
      logger.info(`[EnrollmentAutomation] Enrollment ${enrollment.enrollmentNumber} already processed (${enrollment.status}), skipping`);
      return { skipped: true, status: enrollment.status };
    }

    const student = enrollment.student as any;
    if (!student) {
      throw new Error(`Student record missing for enrollment ${enrollmentId}`);
    }

    // 1. Ensure Student has a User account
    let user = await User.findById(student.user);

    // Generate a plain-text activation token (stored as SHA-256 hash on User)
    const activationToken = crypto.randomBytes(24).toString("hex");
    const hashedActivationToken = crypto.createHash("sha256").update(activationToken).digest("hex");
    const activationExpiry = DateHelper.addMinutes(new Date(), 72 * 60); // 72-hour activation window

    if (!user) {
      const studentRole = await Role.findOne({ name: { $regex: /^student$/i } });
      const salt = await bcrypt.genSalt(10);
      const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), salt);

      const email = student.email || `${student.studentId.toLowerCase()}@student.truelern.com`;
      user = await User.create({
        firstName: student.firstName,
        lastName: student.lastName,
        email,
        password: tempHash,
        role: studentRole?._id,
        isEmailVerified: false,
        // Store hashed activation token so /api/auth/activate can verify it
        resetPasswordToken: hashedActivationToken,
        resetPasswordExpire: activationExpiry,
      });

      student.user = user._id;
      await student.save();
      logger.info(`[EnrollmentAutomation] Created User account ${user._id} for student ${student.studentId}`);
    } else {
      // For existing user accounts that haven't activated: refresh the activation token
      if (!user.isEmailVerified) {
        await User.findByIdAndUpdate(user._id, {
          resetPasswordToken: hashedActivationToken,
          resetPasswordExpire: activationExpiry,
        });
        logger.info(`[EnrollmentAutomation] Refreshed activation token for existing User ${user._id}`);
      }
    }

    // 2. Automatic Batch Assignment via the existing BatchAssignmentService
    const courseId = (enrollment.course as any)?._id || enrollment.course;
    const availableBatch = await Batch.findOne({
      course: courseId,
      status: { $in: ["open", "active", "planning"] },
      isDeleted: { $ne: true },
    }).sort({ batchStart: 1 });

    let batchResult = null;
    if (availableBatch) {
      try {
        batchResult = await AssignmentService.assignStudent({
          batchId: availableBatch._id.toString(),
          studentId: student._id.toString(),
          enrollmentId: enrollment._id.toString(),
        });
        logger.info(`[EnrollmentAutomation] Batch assignment result: ${batchResult.type} for student ${student.studentId}`);
      } catch (err: any) {
        // Student may already be assigned (idempotency) or batch full
        if (err.message?.includes("already assigned")) {
          logger.info(`[EnrollmentAutomation] Student ${student.studentId} already assigned to batch, skipping`);
          batchResult = { type: "already-assigned" };
        } else {
          logger.error(`[EnrollmentAutomation] Batch assignment failed: ${err.message}`);
          // Don't fail the entire pipeline — enrollment is confirmed, batch can be assigned manually
          batchResult = { type: "failed", error: err.message };
        }
      }
    } else {
      logger.warn(`[EnrollmentAutomation] No available batch for course ${courseId}, manual assignment required`);
    }

    // 3. Update Enrollment status
    if (batchResult?.type === "assigned" || batchResult?.type === "already-assigned") {
      enrollment.status = "batch-assigned";
    } else if (batchResult?.type === "waiting-list") {
      // Student was added to waiting list — keep confirmed status
      enrollment.status = "confirmed";
    } else {
      // No batch available or assignment failed — keep confirmed
      enrollment.status = "confirmed";
    }
    await enrollment.save();

    // 4. Update Student status to active
    if (student.status !== "active") {
      student.status = "active";
      await student.save();
    }

    // 5. Dispatch Welcome Email
    const recipientEmail = user.email;
    const courseName = (enrollment.course as any)?.courseName || "your enrolled program";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://truelern.visital.in";

    await EmailService.sendMail({
      to: recipientEmail,
      subject: `Welcome to TrueLern LMS — Enrollment Confirmed for ${courseName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Welcome to TrueLern LMS, ${student.firstName}!</h2>
          <p>Your enrollment in <strong>${courseName}</strong> has been confirmed.</p>
          <p>Your Student ID is: <strong>${student.studentId}</strong></p>
          ${availableBatch ? `<p>You have been assigned to batch: <strong>${availableBatch.batchCode || "Auto-Assigned"}</strong></p>` : ""}
          <p>Please click the link below to set your account password and activate your learning portal:</p>
          <p><a href="${baseUrl}/activate?token=${activationToken}&student=${student.studentId}" style="padding: 10px 20px; background: #059669; color: white; border-radius: 8px; text-decoration: none; display: inline-block;">Activate Your Account</a></p>
          <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">If you did not apply for this enrollment, please disregard this email.</p>
        </div>
      `,
    });

    // 6. Audit trail
    await AuditService.logMutation({
      action: "enrollment.automation-completed",
      entity: "Enrollment",
      entityId: enrollment._id.toString(),
      metadata: {
        enrollmentNumber: enrollment.enrollmentNumber,
        studentId: student.studentId,
        userId: user._id.toString(),
        batchResult: batchResult?.type || "no-batch-available",
        batchId: availableBatch?._id?.toString(),
      },
    });

    logger.info(`[EnrollmentAutomation] Completed automation for enrollment ${enrollment.enrollmentNumber}`);

    return {
      userId: user._id,
      studentId: student._id,
      batchId: availableBatch?._id,
      batchResult: batchResult?.type,
      enrollmentStatus: enrollment.status,
    };
  }
}
