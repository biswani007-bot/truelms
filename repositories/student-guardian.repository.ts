import { StudentGuardian, IStudentGuardian } from "../models/student-guardian.model";
import { BaseRepository } from "./base.repository";

export class StudentGuardianRepository extends BaseRepository<IStudentGuardian> {
  constructor() {
    super(StudentGuardian);
  }
}

export const studentGuardianRepository = new StudentGuardianRepository();
