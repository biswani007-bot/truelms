import { AcademicSession, IAcademicSession } from "../models/academic-session.model";
import { BaseRepository } from "./base.repository";

export class AcademicSessionRepository extends BaseRepository<IAcademicSession> {
  constructor() {
    super(AcademicSession);
  }
}

export const academicSessionRepository = new AcademicSessionRepository();
