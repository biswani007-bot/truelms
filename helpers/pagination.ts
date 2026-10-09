export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

export interface IPaginationResult {
  skip: number;
  limit: number;
  page: number;
}

export class PaginationHelper {
  static getOptions(options: IPaginationOptions): IPaginationResult {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.max(1, Math.min(100, Number(options.limit || 10)));
    const skip = (page - 1) * limit;

    return { skip, limit, page };
  }

  static getMetaData(totalItems: number, page: number, limit: number) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
      totalItems,
      itemCount: Math.min(limit, Math.max(0, totalItems - (page - 1) * limit)),
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };
  }
}
