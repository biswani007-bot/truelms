import { BatchStudent, IBatchStudent } from "../models/batch-student.model";
import { BaseRepository } from "./base.repository";

class BatchStudentRepository extends BaseRepository<IBatchStudent> {
  constructor() {
    super(BatchStudent);
  }
}

export const batchStudentRepository = new BatchStudentRepository();
