import { EnrollmentChecklist, IEnrollmentChecklist } from "../models/enrollment-checklist.model";
import { BaseRepository } from "./base.repository";

export class EnrollmentChecklistRepository extends BaseRepository<IEnrollmentChecklist> {
  constructor() {
    super(EnrollmentChecklist);
  }
}

export const enrollmentChecklistRepository = new EnrollmentChecklistRepository();
