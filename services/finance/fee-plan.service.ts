/* eslint-disable @typescript-eslint/no-explicit-any */
import { feePlanRepository } from "../../repositories/fee-plan.repository";
import { FeePlan } from "../../models/fee-plan.model";

export class FeePlanService {
  static async create(data: {
    code: string;
    course: string;
    academicSession: string;
    currency?: string;
    baseFee: number;
    registrationFee?: number;
    materialFee?: number;
    labFee?: number;
    examFee?: number;
    tax?: number;
    discountRules?: string;
    installmentRules?: string;
    lateFeeRules?: string;
  }) {
    const existing = await feePlanRepository.findOne({ code: data.code });
    if (existing) throw new Error(`Fee plan with code "${data.code}" already exists`);

    return FeePlan.create({
      code: data.code,
      course: data.course as any,
      academicSession: data.academicSession,
      currency: data.currency || "USD",
      baseFee: data.baseFee,
      registrationFee: data.registrationFee || 0,
      materialFee: data.materialFee || 0,
      labFee: data.labFee || 0,
      examFee: data.examFee || 0,
      tax: data.tax || 0,
      discountRules: data.discountRules,
      installmentRules: data.installmentRules,
      lateFeeRules: data.lateFeeRules,
    });
  }

  static async update(id: string, data: Partial<{
    academicSession: string;
    currency: string;
    baseFee: number;
    registrationFee: number;
    materialFee: number;
    labFee: number;
    examFee: number;
    tax: number;
    discountRules: string;
    installmentRules: string;
    lateFeeRules: string;
  }>) {
    const plan = await feePlanRepository.findById(id);
    if (!plan) throw new Error("Fee plan not found");
    return feePlanRepository.update(id, data as any);
  }

  static async findAll(filters: Record<string, any> = {}) {
    return feePlanRepository.findMany(filters, { populate: ["course"] });
  }

  static async findById(id: string) {
    return feePlanRepository.findById(id, { populate: ["course"] });
  }

  static async delete(id: string) {
    return feePlanRepository.softDelete(id);
  }
}
