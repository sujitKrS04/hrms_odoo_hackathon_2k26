/**
 * backend/src/routes/payroll.routes.ts
 * Block 7
 */
import { Router } from 'express';
import { z }      from 'zod';
import { validate }    from '../middleware/validate.middleware';
import { requireRole } from '../middleware/roleGuard.middleware';
import * as ctrl       from '../controllers/payroll.controller';

const router = Router();
// All routes require authentication — authenticate() applied in index.ts

// GET /api/payroll/:userId
// employee → own only; hr → employee only; admin → hr+employee
router.get('/:userId', ctrl.getPayroll);

// PUT /api/payroll/:userId
// employee → 403; hr → employee only; admin → hr+employee
// Client sends CTC + formula params → server computes amounts
const UpdatePayrollSchema = z.object({
  ctc:            z.number({ required_error: 'Annual CTC is required' })
                   .positive('CTC must be a positive number'),
  effectiveFrom:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'effectiveFrom must be YYYY-MM-DD'),
  basicPct:       z.number().min(1).max(90).optional(),
  hraPct:         z.number().min(0).max(100).optional(),
  conveyanceFixed:z.number().min(0).optional(),
  medicalFixed:   z.number().min(0).optional(),
  pfPct:          z.number().min(0).max(100).optional(),
  professionalTax:z.number().min(0).optional(),
  incomeTax:      z.number().min(0).optional(),
});

// Only admin and hr can write payroll (employee access check in service)
router.put(
  '/:userId',
  requireRole('admin', 'hr'),
  validate(UpdatePayrollSchema),
  ctrl.updatePayroll,
);

export default router;
