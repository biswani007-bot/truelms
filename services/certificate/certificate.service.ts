/* eslint-disable @typescript-eslint/no-explicit-any */
import { certificateRepository } from "../../repositories/certificate.repository";
import { certificateTemplateRepository } from "../../repositories/certificate-template.repository";
import { certificateEligibilityRepository } from "../../repositories/certificate-eligibility.repository";
import { studentRepository } from "../../repositories/student.repository";
import { TimelineService } from "./timeline.service";
import { QRService } from "./qr.service";
import { Certificate } from "../../models/certificate.model";
import { CertificateApproval } from "../../models/certificate-approval.model";
import { BatchStudent } from "../../models/batch-student.model";
import { EligibilityService } from "./eligibility.service";
import crypto from "crypto";

export class CertificateService {
  static async generateUniqueCertificateNumber(): Promise<string> {
    const totalCount = await Certificate.countDocuments({});
    let candidateIndex = totalCount + 1;
    let candidate = `CRT-${String(candidateIndex).padStart(6, "0")}`;
    while (await Certificate.exists({ certificateNumber: candidate })) {
      candidateIndex++;
      candidate = `CRT-${String(candidateIndex).padStart(6, "0")}`;
    }
    return candidate;
  }

  static async generateCertificateDraft(
    eligibilityId: string,
    templateCode?: string,
    requestedByUserId?: string,
    customization?: any
  ) {
    const elRecord = await certificateEligibilityRepository.findById(eligibilityId);
    if (!elRecord) throw new Error("Eligibility record not found");

    // Recalculate eligibility with current authoritative rules
    const el = await EligibilityService.calculateEligibility(elRecord.enrollment.toString());
    if (!el || !el.isEligible) throw new Error("Student is not eligible for certificate issuance under current certificate criteria");

    // Idempotency: Return existing certificate if already generated for this enrollment
    const existing = await Certificate.findOne({ enrollment: el.enrollment, isDeleted: { $ne: true } });
    if (existing) {
      return existing;
    }

    let template: any = null;
    if (templateCode) {
      template = await certificateTemplateRepository.findOne({ code: templateCode });
    }
    if (!template) {
      template = await certificateTemplateRepository.findOne({});
    }
    if (!template) {
      // Fallback: create default template if none exists
      template = await certificateTemplateRepository.create({
        code: "DEFAULT-COMPLETION",
        name: "Official Course Completion",
        credentialType: "course-completion",
        backgroundUrl: "/templates/certificate-template.pdf",
        headerText: "Office of Academic Registrar",
        footerText: "Course Lead Faculty",
        qrPosition: { x: 50, y: 50 },
        dynamicFields: ["studentName", "courseName", "completionDate", "grade"],
      });
    }

    const certificateNumber = await CertificateService.generateUniqueCertificateNumber();
    const certificateUuid = crypto.randomUUID();
    const verificationCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const qrCodeMetadata = QRService.generateVerificationQRMetadata(certificateNumber, verificationCode);

    // Resolve actual batch from BatchStudent if available
    const batchStudent = await BatchStudent.findOne({ enrollment: el.enrollment, isDeleted: { $ne: true } });
    const batchId = batchStudent ? batchStudent.batch : el.course;

    const cert = await Certificate.create({
      certificateNumber,
      certificateUuid,
      student: el.student,
      enrollment: el.enrollment,
      course: el.course,
      cohort: batchId,
      batch: batchId,
      completionDate: new Date(),
      status: "draft",
      verificationCode,
      qrCodeMetadata,
      template: template._id as any,
      grade: el.overallGrade || "Pass",
      percentage: el.attendancePercentage,
      customization: customization || undefined,
    });

    // Resolve requestedBy: use provided userId, or resolve student's user
    let resolvedRequester = requestedByUserId;
    if (!resolvedRequester) {
      const studentDoc: any = await studentRepository.findById(el.student.toString());
      if (studentDoc?.user) {
        resolvedRequester = studentDoc.user.toString();
      }
    }

    const approvalData: any = {
      certificate: cert._id as any,
      status: "pending",
    };
    if (resolvedRequester) {
      approvalData.requestedBy = resolvedRequester as any;
    }

    // Create approval request
    await CertificateApproval.create(approvalData);

    await TimelineService.logEvent(
      cert._id.toString(),
      "generated",
      "Certificate draft generated, pending admin governance review",
      resolvedRequester
    );

    return cert;
  }

  /**
   * Authoritative Course Completion Trigger
   * When an enrollment is marked completed or achieves course completion criteria,
   * evaluates eligibility and automatically generates a certificate draft if eligible.
   * Completely idempotent: calling multiple times will never generate duplicate certificates.
   */
  static async onCourseCompletion(enrollmentId: string, triggeredByUserId?: string) {
    // 1. Authoritative check: calculate eligibility against configured rules
    const el = await EligibilityService.calculateEligibility(enrollmentId);
    if (!el || !el.isEligible) {
      return {
        success: false,
        isEligible: false,
        message: "Student does not satisfy current certificate eligibility criteria",
        eligibility: el,
      };
    }

    // 2. Idempotency Check: see if an active certificate draft or issued credential already exists
    const existing = await Certificate.findOne({
      enrollment: el.enrollment,
      status: { $ne: "revoked" },
      isDeleted: { $ne: true },
    });

    if (existing) {
      return {
        success: true,
        isEligible: true,
        created: false,
        certificate: existing,
        message: "Active certificate already exists for this enrollment (idempotent)",
      };
    }

    // 3. Automatically generate certificate draft
    const draft = await this.generateCertificateDraft(
      el._id.toString(),
      undefined,
      triggeredByUserId
    );

    return {
      success: true,
      isEligible: true,
      created: true,
      certificate: draft,
      message: "Certificate draft automatically generated upon course completion and criteria satisfaction",
    };
  }

  /**
   * Controlled Post-Issuance Revision & Reissue Workflow
   * Preserves historical issued certificate and records audit trail.
   */
  static async reviseAndReissue(
    certificateId: string,
    reason: string,
    customizationUpdates: any,
    adminUserId: string
  ) {
    const existing = await Certificate.findById(certificateId);
    if (!existing) throw new Error("Certificate not found");

    if (existing.status !== "issued") {
      throw new Error(`Only issued certificates can undergo revision. Current status: ${existing.status}`);
    }

    if (!reason || !reason.trim()) {
      throw new Error("A specific administrative reason is required for revision and reissue.");
    }

    // 1. Mark original historical certificate as revoked / superseded
    existing.status = "revoked";
    existing.revocationReason = `Superseded by revision: ${reason.trim()}`;
    existing.revokedAt = new Date();
    existing.revokedBy = adminUserId as any;
    await existing.save();

    await TimelineService.logEvent(
      existing._id.toString(),
      "revoked",
      `Certificate revoked and superseded by revision. Reason: ${reason.trim()}`,
      adminUserId
    );

    // 2. Create new revision draft linked to original
    const certificateNumber = await CertificateService.generateUniqueCertificateNumber();
    const certificateUuid = crypto.randomUUID();
    const verificationCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const qrCodeMetadata = QRService.generateVerificationQRMetadata(certificateNumber, verificationCode);
    const revisionNumber = (existing.revisionNumber || 1) + 1;

    const mergedCustomization = {
      ...(existing.customization || {}),
      ...(customizationUpdates || {}),
    };

    const newDraft = await Certificate.create({
      certificateNumber,
      certificateUuid,
      student: existing.student,
      enrollment: existing.enrollment,
      course: existing.course,
      cohort: existing.cohort,
      batch: existing.batch,
      issueDate: new Date(),
      completionDate: existing.completionDate,
      status: "draft",
      verificationCode,
      qrCodeMetadata,
      template: existing.template,
      grade: existing.grade,
      percentage: existing.percentage,
      customization: mergedCustomization,
      previousCertificate: existing._id,
      revisionNumber,
      revisionReason: reason.trim(),
    });

    // 3. Create approval request for the new revision
    const reviseApprovalData: any = {
      certificate: newDraft._id as any,
      status: "pending",
    };
    if (adminUserId) {
      reviseApprovalData.requestedBy = adminUserId as any;
    }
    await CertificateApproval.create(reviseApprovalData);

    await TimelineService.logEvent(
      newDraft._id.toString(),
      "revised",
      `Revision draft #${revisionNumber} created for certificate ${existing.certificateNumber}. Reason: ${reason.trim()}`,
      adminUserId
    );

    return newDraft;
  }

  static async revokeCertificate(id: string, remarks: string, revokedByUserId: string) {
    const updated = await Certificate.findByIdAndUpdate(
      id,
      { status: "revoked", revocationReason: remarks, revokedAt: new Date(), revokedBy: revokedByUserId as any },
      { new: true }
    );
    await TimelineService.logEvent(id, "revoked", `Certificate revoked: ${remarks}`, revokedByUserId);
    return updated;
  }
}
