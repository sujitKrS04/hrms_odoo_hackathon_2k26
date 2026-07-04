/**
 * backend/src/routes/auth.routes.ts
 *
 * Mounts all authentication routes under /api/auth.
 * Zod schemas are defined here so validation is collocated with the route.
 */
import { Router } from 'express';
import { z } from 'zod';
import { validate }      from '../middleware/validate.middleware';
import { authenticate }  from '../middleware/auth.middleware';
import * as authCtrl     from '../controllers/auth.controller';

const router = Router();

// ─── Shared password rule ─────────────────────────────────────────────────────
// Min 8 chars + at least one digit (as specified in requirements).
const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .regex(/\d/, 'Password must contain at least one number');

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
// Public. Creates a company row + admin user in one transaction.

const SignupSchema = z.object({
  companyName:  z.string({ required_error: 'Company name is required' })
                 .min(2, 'Company name must be at least 2 characters'),
  companyEmail: z.string().email('Invalid company email').optional().or(z.literal('')),
  companyPhone: z.string().optional(),
  firstName:    z.string({ required_error: 'First name is required' })
                 .min(1, 'First name is required'),
  lastName:     z.string({ required_error: 'Last name is required' })
                 .min(1, 'Last name is required'),
  email:        z.string({ required_error: 'Email is required' })
                 .email('Please enter a valid email address'),
  password:     passwordSchema,
});

router.post(
  '/signup',
  validate(SignupSchema),
  authCtrl.signup,
);

// ─── POST /api/auth/users ─────────────────────────────────────────────────────
// Requires auth (admin or hr). Auto-generates login_id + system password.

const CreateUserSchema = z.object({
  firstName:     z.string({ required_error: 'First name is required' })
                  .min(1, 'First name is required'),
  lastName:      z.string({ required_error: 'Last name is required' })
                  .min(1, 'Last name is required'),
  email:         z.string({ required_error: 'Email is required' })
                  .email('Please enter a valid email address'),
  role:          z.enum(['hr', 'employee'], {
                   required_error: 'Role is required',
                   invalid_type_error: "Role must be 'hr' or 'employee'",
                 }),
  departmentId:  z.string().uuid('Invalid department ID').optional(),
  jobPositionId: z.string().uuid('Invalid job position ID').optional(),
  managerId:     z.string().uuid('Invalid manager ID').optional(),
  phone:         z.string().optional(),
});

router.post(
  '/users',
  authenticate,          // requires valid JWT
  validate(CreateUserSchema),
  authCtrl.createUser,
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Public. Returns JWT + mustChangePassword flag.

const LoginSchema = z.object({
  email:    z.string({ required_error: 'Login ID or Email is required' })
             .min(1, 'Login ID or Email is required'),
  password: z.string({ required_error: 'Password is required' })
             .min(1, 'Password is required'),
});

router.post(
  '/login',
  validate(LoginSchema),
  authCtrl.login,
);

// ─── POST /api/auth/change-password ──────────────────────────────────────────
// Requires auth. Clears mustChangePassword flag on success.

const ChangePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' })
                    .min(1, 'Current password is required'),
  newPassword:     passwordSchema,
});

router.post(
  '/change-password',
  authenticate,
  validate(ChangePasswordSchema),
  authCtrl.changePassword,
);

export default router;
