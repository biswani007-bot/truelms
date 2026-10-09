import { StudentMedical, IStudentMedical } from "../models/student-medical.model";
import { BaseRepository } from "./base.repository";

export class StudentMedicalRepository extends BaseRepository<IStudentMedical> {
  constructor() {
    super(StudentMedical);
  }
}

export const studentMedicalRepository = new StudentMedicalRepository();
