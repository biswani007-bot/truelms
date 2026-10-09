export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logged out successfully",
    REFRESH_SUCCESS: "Tokens refreshed successfully",
    FORGOT_PASSWORD_SENT: "Password reset email sent",
    RESET_PASSWORD_SUCCESS: "Password reset successfully",
    CHANGE_PASSWORD_SUCCESS: "Password changed successfully",
    UNAUTHORIZED: "Not authorized, no valid token",
    FORBIDDEN: "Not authorized, insufficient privileges",
    INVALID_CREDENTIALS: "Invalid email or password",
    ACCOUNT_DISABLED: "Account is disabled",
  },
  COMMON: {
    SUCCESS: "Operation successful",
    ERROR: "An error occurred",
    NOT_FOUND: "Resource not found",
    VALIDATION_ERROR: "Validation failed",
    INTERNAL_SERVER_ERROR: "Internal server error",
  },
} as const;
