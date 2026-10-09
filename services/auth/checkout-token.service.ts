/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export interface ICheckoutTokenPayload {
  enrollmentId: string;
  invoiceId: string;
  studentId?: string;
  parentId?: string;
  courseId?: string;
  email: string;
  purpose: "public_checkout";
  environment: string;
}

export interface IHandoffTokenPayload {
  userId: string;
  studentId: string;
  email: string;
  purpose: "student_handoff";
  environment: string;
  enrollmentId: string;
}

export class CheckoutTokenService {
  private static getSecret(): string {
    return env.JWT_SECRET + "_checkout_gate_2026";
  }

  private static getHandoffSecret(): string {
    return env.JWT_SECRET + "_handoff_gate_2026";
  }

  /**
   * Signs a short-lived (30 minutes), opaque checkout token bound to
   * enrollment, invoice, student, parent, course, applicant email, and current environment.
   */
  static signCheckoutToken(params: {
    enrollmentId: string;
    invoiceId: string;
    studentId?: string;
    parentId?: string;
    courseId?: string;
    email: string;
  }): string {
    const payload: ICheckoutTokenPayload = {
      enrollmentId: params.enrollmentId,
      invoiceId: params.invoiceId,
      studentId: params.studentId,
      parentId: params.parentId,
      courseId: params.courseId,
      email: params.email.toLowerCase().trim(),
      purpose: "public_checkout",
      environment: process.env.NODE_ENV || "development",
    };

    return jwt.sign(payload, this.getSecret(), {
      expiresIn: "30m",
      audience: "truelern-public-checkout",
      issuer: "truelern-enrollment-pipeline",
    });
  }

  /**
   * Verifies and decodes checkout token safely.
   */
  static verifyCheckoutToken(token: string): ICheckoutTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.getSecret(), {
        audience: ["truelern-public-checkout", "lmsca-public-checkout"],
        issuer: ["truelern-enrollment-pipeline", "lmsca-enrollment-pipeline"],
      }) as ICheckoutTokenPayload;

      if (decoded.purpose !== "public_checkout") {
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Signs a single-purpose, short-lived (10 minutes) student credential handoff token.
   * Bound to student userId, email, and enrollment ID.
   * Does NOT contain passwords or permanent secrets.
   */
  static signHandoffToken(params: {
    userId: string;
    studentId: string;
    email: string;
    enrollmentId: string;
  }): string {
    const payload: IHandoffTokenPayload = {
      userId: params.userId,
      studentId: params.studentId,
      email: params.email.toLowerCase().trim(),
      purpose: "student_handoff",
      environment: process.env.NODE_ENV || "development",
      enrollmentId: params.enrollmentId,
    };

    return jwt.sign(payload, this.getHandoffSecret(), {
      expiresIn: "10m",
      audience: "truelern-student-handoff",
      issuer: "truelern-enrollment-pipeline",
    });
  }

  /**
   * Verifies the student credential handoff token.
   */
  static verifyHandoffToken(token: string): IHandoffTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.getHandoffSecret(), {
        audience: "truelern-student-handoff",
        issuer: "truelern-enrollment-pipeline",
      }) as IHandoffTokenPayload;

      if (decoded.purpose !== "student_handoff") {
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }
}
