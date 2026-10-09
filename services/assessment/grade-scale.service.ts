import { gradeScaleRepository } from "../../repositories/grade-scale.repository";

export class GradeScaleService {
  static async getGrade(percentage: number) {
    const scales = await gradeScaleRepository.findMany({});
    const match = scales.find((s) => percentage >= s.minPercentage && percentage <= s.maxPercentage);
    return match ? match.gradeKey : "F";
  }
}
