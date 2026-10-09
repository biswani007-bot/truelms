/* eslint-disable @typescript-eslint/no-explicit-any */
import { assignmentRubricRepository } from "../../repositories/assignment-rubric.repository";

export class RubricService {
  static async addRubric(assignmentId: string, criteria: Array<{ criterion: string; maxMarks: number; description?: string }>) {
    const results = [];
    for (const c of criteria) {
      const res = await assignmentRubricRepository.create({
        assignment: assignmentId as any,
        criterion: c.criterion,
        maxMarks: c.maxMarks,
        description: c.description,
      });
      results.push(res);
    }
    return results;
  }
}
