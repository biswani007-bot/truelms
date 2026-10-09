/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from "../utils/api-response";

export class ResponseHelper {
  static success<T>(message: string, data?: T, meta?: any) {
    return ApiResponse.success(message, data, meta);
  }

  static error(message: string, code?: string, details?: any) {
    return {
      success: false,
      message,
      code: code || "INTERNAL_SERVER_ERROR",
      details,
    };
  }
}
