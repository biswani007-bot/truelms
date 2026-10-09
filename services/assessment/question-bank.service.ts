/* eslint-disable @typescript-eslint/no-explicit-any */
import { questionBankRepository } from "../../repositories/question-bank.repository";
import { assessmentQuestionRepository } from "../../repositories/assessment-question.repository";

export class QuestionBankService {
  static async createQuestion(data: any) {
    return questionBankRepository.create(data);
  }

  static async linkToAssessment(assessmentId: string, questionId: string, marksOverride?: number, displayOrder = 1) {
    return assessmentQuestionRepository.create({
      assessment: assessmentId as any,
      questionBank: questionId as any,
      marksOverride,
      displayOrder,
    });
  }
}
