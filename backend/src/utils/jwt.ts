/**
 * backend/src/utils/jwt.ts
 *
 * Thin wrappers around jsonwebtoken so the rest of the codebase never
 * imports 'jsonwebtoken' directly (easier to swap or mock in tests).
 */
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { env } from '../config/env';

/** Shape embedded in every access token */
export interface JwtPayload {
  id: string;
  role: UserRole;
  companyId: string;
}

/**
 * Signs a new JWT for the given payload.
 * Expiry is controlled by JWT_EXPIRES_IN env var (default '7d').
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifies a token and returns the decoded payload.
 * Throws a JsonWebTokenError or TokenExpiredError on failure —
 * auth.middleware.ts catches these and converts them to ApiError(401).
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
