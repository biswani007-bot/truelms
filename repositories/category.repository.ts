import { Category, ICategory } from "../models/category.model";
import { BaseRepository } from "./base.repository";

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(Category);
  }
}

export const categoryRepository = new CategoryRepository();
