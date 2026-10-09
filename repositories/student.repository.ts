import { Student, IStudent } from "../models/student.model";
import { BaseRepository } from "./base.repository";

export class StudentRepository extends BaseRepository<IStudent> {
  constructor() {
    super(Student);
  }
}

export const studentRepository = new StudentRepository();
