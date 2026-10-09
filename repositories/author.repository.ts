import { Author, IAuthor } from "../models/author.model";
import { BaseRepository } from "./base.repository";

export class AuthorRepository extends BaseRepository<IAuthor> {
  constructor() {
    super(Author);
  }
}

export const authorRepository = new AuthorRepository();
