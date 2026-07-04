/**
 * backend/src/routes/employee.routes.ts
 * Blocks 1, 2, 3
 */
import { Router } from 'express';
import { z } from 'zod';
import { validate }     from '../middleware/validate.middleware';
import { requireRole }  from '../middleware/roleGuard.middleware';
import * as ctrl        from '../controllers/employee.controller';

const router = Router();
// All employee routes require authentication — authenticate() applied in index.ts

// ── Block 1: GET /api/employees ───────────────────────────────────────────────
// Only admin and hr can list employees. employee → 403 handled in service.
router.get('/', ctrl.listEmployees);

// ── Block 2: Profile ─────────────────────────────────────────────────────────

router.get('/:id/profile', ctrl.getProfile);

const UpdateProfileSchema = z.object({
  phone:                 z.string().optional(),
  address:               z.string().optional(),
  city:                  z.string().optional(),
  state:                 z.string().optional(),
  pincode:               z.string().optional(),
  nationality:           z.string().optional(),
  maritalStatus:         z.string().optional(),
  avatarUrl:             z.string().url('Invalid URL format').optional().or(z.literal('')),
  emergencyContactName:  z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  dateOfBirth:           z.string().optional(),
  gender:                z.string().optional(),
}).strict();   // reject unknown keys

router.patch('/:id/profile', validate(UpdateProfileSchema), ctrl.updateProfile);

// ── Block 3: Live status ──────────────────────────────────────────────────────
router.get('/:id/status', ctrl.getStatus);

export default router;
