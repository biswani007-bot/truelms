import { Cohort, ICohort } from "../models/cohort.model";
import { BaseRepository } from "./base.repository";

export class CohortRepository extends BaseRepository<ICohort> {
  constructor() {
    super(Cohort);
  }
}

export const cohortRepository = new CohortRepository();
