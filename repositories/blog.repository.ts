import { Blog, IBlog } from "../models/blog.model";
import { BaseRepository } from "./base.repository";

export class BlogRepository extends BaseRepository<IBlog> {
  constructor() {
    super(Blog);
  }
}

export const blogRepository = new BlogRepository();
