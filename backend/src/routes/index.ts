/**
 * backend/src/routes/index.ts
 *
 * Root API router. All feature routers are mounted here.
 * Imported by app.ts and mounted at /api.
 *
 * As new feature routes are added they go here:
 *   import authRoutes       from './auth.routes';
 *   import employeeRoutes   from './employee.routes';
 *   router.use('/auth',      authRoutes);
 *   router.use('/employees', authenticate, employeeRoutes);
 */
import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter   from './auth.routes';

const router = Router();

// ── Unauthenticated ──────────────────────────────────────────────────────────
router.use(healthRouter);       // GET /api/health
router.use('/auth', authRouter); // POST /api/auth/signup | /login | /users | /change-password

// ── Feature routes (added in later phases) ───────────────────────────────────
// router.use('/employees',   authenticate, requireRole('admin','hr'), employeeRoutes);
// router.use('/attendance',  authenticate, attendanceRoutes);
// router.use('/leave',       authenticate, leaveRoutes);
// router.use('/payroll',     authenticate, requireRole('admin','hr'), payrollRoutes);
// router.use('/profile',     authenticate, profileRoutes);

export default router;
