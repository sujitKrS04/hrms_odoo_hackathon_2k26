/**
 * backend/src/routes/index.ts
 * Root API router — all feature routers mounted here.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import healthRouter     from './health.routes';
import authRouter       from './auth.routes';
import employeeRouter   from './employee.routes';
import attendanceRouter from './attendance.routes';
import leaveRouter      from './leave.routes';
import payrollRouter    from './payroll.routes';

const router = Router();

// ── Public (no auth) ─────────────────────────────────────────────────────────
router.use(healthRouter);          // GET /api/health
router.use('/auth', authRouter);   // POST /api/auth/* (signup, login, users, change-password)

// ── All routes below require a valid JWT ─────────────────────────────────────
router.use(authenticate);

router.use('/employees',      employeeRouter);    // GET, PATCH /api/employees
router.use('/attendance',     attendanceRouter);  // POST check-in/out, GET list
router.use('/leave-requests', leaveRouter);       // GET, POST, PATCH /api/leave-requests
router.use('/payroll',        payrollRouter);     // GET, PUT /api/payroll/:userId

export default router;
