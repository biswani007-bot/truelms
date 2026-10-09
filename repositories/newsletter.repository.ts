import { Newsletter, INewsletter } from "../models/newsletter.model";
import { BaseRepository } from "./base.repository";

export class NewsletterRepository extends BaseRepository<INewsletter> {
  constructor() {
    super(Newsletter);
  }
}

export const newsletterRepository = new NewsletterRepository();
