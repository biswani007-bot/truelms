import { Event, IEvent } from "../models/event.model";
import { BaseRepository } from "./base.repository";

export class EventRepository extends BaseRepository<IEvent> {
  constructor() {
    super(Event);
  }
}

export const eventRepository = new EventRepository();
