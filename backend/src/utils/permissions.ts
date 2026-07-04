/**
 * backend/src/utils/permissions.ts
 *
 * Single source of truth for role-based management rules.
 * Every controller that mutates another user's data MUST call canManage()
 * here — do NOT reimplement this check inline anywhere else.
 *
 * Rules:
 *   admin    → can manage hr and employee   (not other admins)
 *   hr       → can manage employee only
 *   employee → cannot manage anyone (self-service only via identity check)
 */
import type { UserRole } from '@prisma/client';

/**
 * Returns true if an actor with `actorRole` is permitted to create, update,
 * or delete a record owned by a user with `targetRole`.
 *
 * @example
 *   // In a controller before mutating another user's record:
 *   if (!canManage(req.user!.role, targetUser.role)) {
 *     throw new ApiError(403, 'You do not have permission to modify this user');
 *   }
 */
export function canManage(actorRole: UserRole, targetRole: UserRole): boolean {
  switch (actorRole) {
    case 'admin':
      // Admin can manage HR and employees — NOT other admins (prevents privilege escalation)
      return targetRole === 'hr' || targetRole === 'employee';

    case 'hr':
      // HR can only manage employees
      return targetRole === 'employee';

    case 'employee':
      // Employees manage nobody else; identity-level self-service is handled
      // via ID comparison in the controller, not here
      return false;
  }
}
