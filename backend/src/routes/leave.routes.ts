/**
 * backend/src/routes/leave.routes.ts
 * Block 6
 */
import { Router } from 'express';
import { z }      from 'zod';
import { validate } from '../middleware/validate.middleware';
import * as ctrl    from '../controllers/leave.controller';

const router = Router();
// All routes require authentication — authenticate() applied in index.ts

// GET /api/leave-requests  (list, role-scoped)
router.get('/', ctrl.listLeaveRequests);

// POST /api/leave-requests  (employee submits own request)
const CreateLeaveSchema = z.object({
  leaveTypeId: z.string().uuid('Invalid leave type ID'),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  daysCount:   z.number({ required_error: 'daysCount is required' })
                .int('daysCount must be a whole number')
                .positive('daysCount must be positive'),
  reason:      z.string().optional(),
});

router.post('/', validate(CreateLeaveSchema), ctrl.createLeaveRequest);

// PATCH /api/leave-requests/:id  (admin/hr approve or reject)
const ReviewLeaveSchema = z.object({
  decision:    z.enum(['approved', 'rejected'], {
                 required_error: 'decision is required',
                 invalid_type_error: "decision must be 'approved' or 'rejected'",
               }),
  reviewerNote: z.string().optional(),
});

router.patch('/:id', validate(ReviewLeaveSchema), ctrl.reviewLeaveRequest);

export default router;
