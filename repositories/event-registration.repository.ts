import { EventRegistration, IEventRegistration } from "../models/event-registration.model";
import { BaseRepository } from "./base.repository";

export class EventRegistrationRepository extends BaseRepository<IEventRegistration> {
  constructor() {
    super(EventRegistration);
  }
}

export const eventRegistrationRepository = new EventRegistrationRepository();
