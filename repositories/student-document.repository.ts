import { StudentDocument, IStudentDocument } from "../models/student-document.model";
import { BaseRepository } from "./base.repository";

export class StudentDocumentRepository extends BaseRepository<IStudentDocument> {
  constructor() {
    super(StudentDocument);
  }
}

export const studentDocumentRepository = new StudentDocumentRepository();
