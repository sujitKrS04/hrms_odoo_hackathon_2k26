/**
 * backend/src/middleware/roleGuard.middleware.ts
 *
 * Route-level role gating. Use AFTER authenticate() — assumes req.user is set.
 *
 * Usage:
 *   // Only admin and HR can access this route
 *   router.get('/employees', authenticate, requireRole('admin', 'hr'), listEmployees);
 *
 *   // Only admin can access
 *   router.delete('/users/:id', authenticate, requireRole('admin'), deleteUser);
 *
 * For cross-user mutations (e.g. updating another user's profile), also call
 * canManage() from utils/permissions.ts inside the controller — requireRole
 * only gates at the route level, not at the record level.
 */
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

/**
 * Returns Express middleware that allows only requests whose req.user.role
 * is in the provided `roles` list.
 */
export function requireRole(...roles: UserRole[]) {
  return function roleGuard(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      // authenticate() wasn't applied before this middleware
      next(new ApiError(401, 'Authentication required.'));
      return;
    }

    if (!(roles as string[]).includes(req.user.role)) {
      next(
        new ApiError(
          403,
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
        ),
      );
      return;
    }

    next();
  };
}
