import { CohortCalendar, ICohortCalendar } from "../models/cohort-calendar.model";
import { BaseRepository } from "./base.repository";

export class CohortCalendarRepository extends BaseRepository<ICohortCalendar> {
  constructor() {
    super(CohortCalendar);
  }
}

export const cohortCalendarRepository = new CohortCalendarRepository();
