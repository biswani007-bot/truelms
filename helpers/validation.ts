import { ZodSchema } from "zod";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

export class ValidationHelper {
  static validate<T>(schema: ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errorDetails = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new ApiError(400, "Validation failed", ERROR_CODES.VALIDATION_ERROR, errorDetails);
    }
    return result.data;
  }
}
