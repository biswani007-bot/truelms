import { FAQ, IFAQ } from "../models/faq.model";
import { BaseRepository } from "./base.repository";

export class FAQRepository extends BaseRepository<IFAQ> {
  constructor() {
    super(FAQ);
  }
}

export const faqRepository = new FAQRepository();
