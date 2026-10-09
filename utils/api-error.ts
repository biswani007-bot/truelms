/* eslint-disable @typescript-eslint/no-explicit-any */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, message: string, code = "INTERNAL_SERVER_ERROR", details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
    // Avoid capturing stack trace in production for API errors
    if (process.env.NODE_ENV !== "production") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
