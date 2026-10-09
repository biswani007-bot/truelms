import { QuestionBank, IQuestionBank } from "../models/question-bank.model";
import { BaseRepository } from "./base.repository";

class QuestionBankRepository extends BaseRepository<IQuestionBank> {
  constructor() {
    super(QuestionBank);
  }
}

export const questionBankRepository = new QuestionBankRepository();
