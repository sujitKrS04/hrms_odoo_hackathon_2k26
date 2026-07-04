/**
 * backend/src/middleware/error.middleware.ts
 *
 * Centralised error handler + 404 handler.
 * Must be registered LAST in app.ts after all routes.
 *
 * Consistent response envelope:
 *   4xx/5xx  →  { error: { message: string; field?: string; fields?: FieldError[] } }
 *
 * Every controller/service throws ApiError or ZodError; this handler
 * converts them into the appropriate HTTP response so no error-formatting
 * logic ever lives in individual controllers.
 */
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

// ─── Error shapes ─────────────────────────────────────────────────────────────

interface FieldError {
  field: string;
  message: string;
}

interface ErrorBody {
  message: string;
  field?: string;
  fields?: FieldError[];
}

// ─── 404 handler (register before errorHandler) ───────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `Route ${req.method} ${req.path} not found.` },
  });
}

// ─── Central error handler ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Headers already sent — delegate to Express's default
  if (res.headersSent) return;

  let status = 500;
  let body: ErrorBody = { message: 'Internal server error' };

  // ── Known API error ────────────────────────────────────────────────────
  if (err instanceof ApiError) {
    status = err.statusCode;
    body = {
      message: err.message,
      ...(err.field ? { field: err.field } : {}),
    };

  // ── Zod validation error (thrown manually or by validate middleware) ───
  } else if (err instanceof ZodError) {
    status = 400;
    body = {
      message: 'Validation failed',
      fields: err.errors.map((e) => ({
        field: e.path.join('.') || '_root',
        message: e.message,
      })),
    };

  // ── Unexpected / unhandled errors ──────────────────────────────────────
  } else {
    // Log full error in all environments for observability
    console.error('[Unhandled Error]', err);

    // Only surface details in development (never leak internals in prod)
    if (env.NODE_ENV === 'development' && err instanceof Error) {
      body = { message: err.message };
    }
  }

  res.status(status).json({ error: body });
}
