/**
 * backend/src/types/express.d.ts
 * Augments Express's Request interface so `req.user` is typed everywhere.
 * Populated by auth.middleware.ts after JWT verification.
 */
import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by authenticate() middleware after a valid JWT is verified.
       * Controllers can safely use req.user! inside authenticated routes.
       */
      user?: {
        id: string;
        role: UserRole;
        companyId: string;
      };
    }
  }
}

// Makes this file a module (required for global augmentation to work)
export {};
