
/**
 * @swagger
 * /api/crm/leads/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/crm/leads/{id}
 *     tags: [crm]
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

/**
 * @swagger
 * /api/crm/leads/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/crm/leads/{id}
 *     tags: [crm]
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

/**
 * @swagger
 * /api/crm/leads/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/crm/leads/{id}
 *     tags: [crm]
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { leadRepository } from "../../../../../repositories/lead.repository";
import { leadTimelineRepository } from "../../../../../repositories/lead-timeline.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

import { DemoSession } from "../../../../../models/demo-session.model";
import { Enrollment } from "../../../../../models/enrollment.model";
import { Invoice } from "../../../../../models/invoice.model";
import { Payment } from "../../../../../models/payment.model";
import { Receipt } from "../../../../../models/receipt.model";
import { Lead } from "../../../../../models/lead.model";

export const GET = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"],
  apiHandler(async (req: NextRequest, arg1: any, arg2?: any) => {
    await connectDB();
    const segmentData = (arg2 && arg2.params) ? arg2 : arg1;
    const params = await segmentData.params;
    const { id } = params;

    const lead = await leadRepository.findById(id, { populate: ["leadOwner", "student", "parent"] as any });
    if (!lead) {
      return NextResponse.json(ResponseHelper.error("Lead not found", "NOT_FOUND"), { status: 404 });
    }

    // Resolve real operational records
    const demo = await DemoSession.findOne({
      $or: [{ lead: lead._id }, ...(lead.student ? [{ student: (lead.student as any)._id || lead.student }] : [])],
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate("teacher", "firstName lastName");

    const enrollment = await Enrollment.findOne({
      $or: [{ lead: lead._id }, ...(lead.student ? [{ student: (lead.student as any)._id || lead.student }] : [])],
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    let invoice = null;
    let payment = null;
    let receipt = null;

    if (enrollment) {
      invoice = await Invoice.findOne({ enrollment: enrollment._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
      if (invoice) {
        payment = await Payment.findOne({ invoice: invoice._id, status: "success" }).sort({ createdAt: -1 });
        if (payment) {
          receipt = await Receipt.findOne({ payment: payment._id });
        }
      }
    }

    const leadObj = (lead as any).toObject ? (lead as any).toObject() : { ...lead };

    // Resolve authoritative contact name from linked Parent when available
    if (leadObj.parent && typeof leadObj.parent === "object" && (leadObj.parent.firstName || leadObj.parent.lastName)) {
      const authoritativeParentName = `${leadObj.parent.firstName || ""} ${leadObj.parent.lastName || ""}`.trim();
      if (authoritativeParentName) {
        if (leadObj.fullName !== authoritativeParentName) {
          // Self-heal stale denormalized snapshot in background
          Lead.updateOne({ _id: lead._id }, { $set: { fullName: authoritativeParentName } }).exec().catch(() => {});
        }
        leadObj.fullName = authoritativeParentName;
      }
    }

    return NextResponse.json(
      ResponseHelper.success("Fetched lead details", {
        ...leadObj,
        demoSession: demo
          ? {
              id: demo._id,
              demoCode: demo.demoCode,
              status: demo.status,
              scheduledStart: demo.scheduledStart,
              teacher: demo.teacher
                ? {
                    id: (demo.teacher as any)._id,
                    name: `${(demo.teacher as any).firstName} ${(demo.teacher as any).lastName}`.trim(),
                  }
                : null,
            }
          : null,
        enrollment: enrollment
          ? {
              id: enrollment._id,
              enrollmentNumber: enrollment.enrollmentNumber,
              status: enrollment.status,
            }
          : null,
        invoice: invoice
          ? {
              id: invoice._id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              totalAmount: invoice.totalAmount,
              outstandingAmount: invoice.outstandingAmount,
            }
          : null,
        payment: payment
          ? {
              id: payment._id,
              paymentNumber: payment.paymentNumber,
              amount: payment.amount,
              status: payment.status,
            }
          : null,
        receipt: receipt
          ? {
              id: receipt._id,
              receiptNumber: receipt.receiptNumber,
              amount: receipt.amount,
            }
          : null,
      }),
      { status: 200 }
    );
  })
);

export const PUT = withRoles(
  ["Admin", "Super Admin", "Sales Counsellor", "Marketing Manager"],
  apiHandler(async (req: NextRequest, arg1: any, arg2?: any) => {
    await connectDB();
    const segmentData = (arg2 && arg2.params) ? arg2 : arg1;
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const oldLead = await leadRepository.findById(id);
    if (!oldLead) {
      return NextResponse.json(ResponseHelper.error("Lead not found", "NOT_FOUND"), { status: 404 });
    }

    const updated = await leadRepository.update(id, body);

    // Timeline Logging on Status Change
    if (body.status && body.status !== oldLead.status) {
      await leadTimelineRepository.create({
        lead: id,
        event: "status_change",
        description: `Lead status updated from ${oldLead.status} to ${body.status}`,
      });
    }

    // Timeline Logging on Assignment Change
    if (body.leadOwner && body.leadOwner !== oldLead.leadOwner?.toString()) {
      await leadTimelineRepository.create({
        lead: id,
        event: "assigned",
        description: "Lead counselor assignment changed",
      });
    }

    return NextResponse.json(ResponseHelper.success("Lead details updated", updated), { status: 200 });
  })
);

export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const result = await leadRepository.softDelete(id);
    if (!result) {
      return NextResponse.json(ResponseHelper.error("Lead not found", "NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Lead archived successfully", result), { status: 200 });
  })
);
