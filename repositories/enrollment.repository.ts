import { Enrollment, IEnrollment } from "../models/enrollment.model";
import { BaseRepository } from "./base.repository";

export class EnrollmentRepository extends BaseRepository<IEnrollment> {
  constructor() {
    super(Enrollment);
  }
}

export const enrollmentRepository = new EnrollmentRepository();
