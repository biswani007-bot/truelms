import { Page, IPage } from "../models/page.model";
import { BaseRepository } from "./base.repository";

export class PageRepository extends BaseRepository<IPage> {
  constructor() {
    super(Page);
  }
}

export const pageRepository = new PageRepository();
