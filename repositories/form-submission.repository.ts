import { FormSubmission, IFormSubmission } from "../models/form-submission.model";
import { BaseRepository } from "./base.repository";

export class FormSubmissionRepository extends BaseRepository<IFormSubmission> {
  constructor() {
    super(FormSubmission);
  }
}

export const formSubmissionRepository = new FormSubmissionRepository();
