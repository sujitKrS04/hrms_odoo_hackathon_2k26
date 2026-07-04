/**
 * backend/src/utils/ApiError.ts
 *
 * Throwable error class for all deliberate API errors (4xx / 5xx).
 * The centralized error.middleware.ts catches these and formats the
 * response into the standard  { error: { message, field? } }  shape.
 *
 * Usage in a controller:
 *   throw new ApiError(404, 'Employee not found');
 *   throw new ApiError(400, 'Email already in use', 'email');
 */
export class ApiError extends Error {
  constructor(
    /** HTTP status code to send, e.g. 400 | 401 | 403 | 404 | 409 | 500 */
    public readonly statusCode: number,
    /** Human-readable message surfaced to the client */
    message: string,
    /**
     * Optional field name that caused the error.
     * When present the frontend can highlight the specific form field.
     * e.g. 'email', 'loginId', 'password'
     */
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}
