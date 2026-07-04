/**
 * backend/src/middleware/auth.middleware.ts
 *
 * Verifies the Bearer JWT on every protected route and attaches the decoded
 * payload to req.user = { id, role, companyId }.
 *
 * Usage:
 *   router.get('/profile', authenticate, profileController.getMe);
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Expect exactly:  Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(
      new ApiError(
        401,
        'Missing or malformed Authorization header. Expected: Bearer <token>',
      ),
    );
    return;
  }

  const token = authHeader.slice(7); // drop 'Bearer '

  try {
    const payload = verifyToken(token);
    // Attach to request — downstream controllers access req.user!
    req.user = {
      id:        payload.id,
      role:      payload.role,
      companyId: payload.companyId,
    };
    next();
  } catch {
    // jsonwebtoken throws JsonWebTokenError | TokenExpiredError | NotBeforeError
    next(new ApiError(401, 'Token is invalid or has expired. Please log in again.'));
  }
}
