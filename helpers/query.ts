/* eslint-disable @typescript-eslint/no-explicit-any */

import { PaginationInput } from "../dtos/pagination.dto";

export class QueryHelper {
  /**
   * Compiles search keyword and key-value filters into a MongoDB FilterQuery.
   */
  static buildFilters(
    input: PaginationInput,
    searchableFields: string[] = []
  ): Record<string, any> {
    const query: Record<string, any> = {};

    // 1. Soft delete filter by default
    query.isDeleted = false;

    // 2. Custom Key-Value Filters
    if (input.filters) {
      Object.entries(input.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          // Date range filters (e.g. { createdAt: { start: '...', end: '...' } })
          if (
            typeof value === "object" &&
            ("start" in value || "end" in value)
          ) {
            const dateRange: any = {};
            if ((value as any).start) {
              dateRange.$gte = new Date((value as any).start);
            }
            if ((value as any).end) {
              dateRange.$lte = new Date((value as any).end);
            }
            query[key] = dateRange;
          } else {
            query[key] = value;
          }
        }
      });
    }

    // 3. Case-insensitive Search Keyword
    if (input.search && searchableFields.length > 0) {
      const searchRegex = new RegExp(input.search, "i");
      query.$or = searchableFields.map((field) => ({
        [field]: searchRegex,
      }));
    }

    return query;
  }

  /**
   * Compiles sorting options into a Mongoose sort definition.
   */
  static buildSort(input: PaginationInput): { [key: string]: any } {
    const sortField = input.sort || "createdAt";
    const sortDirection = input.order === "asc" ? 1 : -1;
    return { [sortField]: sortDirection };
  }

  /**
   * Generates pagination meta metadata.
   */
  static buildMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
}
