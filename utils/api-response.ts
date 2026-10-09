/* eslint-disable @typescript-eslint/no-explicit-any */
export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | Record<string, never> | null;
  meta: Record<string, any>;
  code?: string;
  details?: any;

  constructor(
    success: boolean,
    message: string,
    data: T | Record<string, never> | null = {},
    meta: Record<string, any> = {},
    code?: string,
    details?: any
  ) {
    this.success = success;
    this.message = message;
    this.data = data === null ? {} : data;
    this.meta = meta;
    if (code) this.code = code;
    if (details) this.details = details;
  }

  static success<T>(message: string, data: T | null = null, meta: Record<string, any> = {}): ApiResponse<T> {
    return new ApiResponse(true, message, data, meta);
  }

  static error<T>(
    message: string,
    code = "INTERNAL_SERVER_ERROR",
    details: any = null,
    meta: Record<string, any> = {}
  ): ApiResponse<T> {
    return new ApiResponse(false, message, {} as any, meta, code, details);
  }
}
