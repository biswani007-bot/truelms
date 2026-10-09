import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.preprocess((val) => Number(val || 1), z.number().min(1).default(1)),
  limit: z.preprocess((val) => Number(val || 10), z.number().min(1).max(100).default(10)),
  search: z.string().optional(),
  sort: z.string().optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  filters: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      }
      return val || {};
    },
    z.record(z.string(), z.any())
  ).optional().default({}),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
