/**
 * backend/src/routes/attendance.routes.ts
 * Blocks 4 & 5
 */
import { Router } from 'express';
import * as ctrl from '../controllers/attendance.controller';

const router = Router();
// All routes require authentication — authenticate() applied in index.ts

// Block 4 — check-in / check-out (no body userId accepted)
router.post('/check-in',  ctrl.checkIn);
router.post('/check-out', ctrl.checkOut);

// Block 5 — list (role-scoped in service)
router.get('/', ctrl.listAttendance);

export default router;
