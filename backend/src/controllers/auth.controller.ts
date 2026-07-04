/**
 * backend/src/controllers/auth.controller.ts
 *
 * Thin HTTP layer — calls the auth service, shapes responses, nothing else.
 * All business logic lives in services/auth.service.ts.
 */
import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import type { UserRole } from '@prisma/client';

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json({
      message: 'Company and admin account created successfully.',
      token:   result.token,
      user:    result.user,
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/users ─────────────────────────────────────────────────────

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = req.user!; // set by authenticate()
    const result = await authService.createUser(
      actor.id,
      actor.role as UserRole,
      actor.companyId,
      req.body,
    );

    res.status(201).json({
      message:
        'User created. Share the generated password with the new user securely — ' +
        'it will not be shown again.',
      user:              result.user,
      generatedPassword: result.generatedPassword,
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.json({
      token:              result.token,
      mustChangePassword: result.mustChangePassword,
      user:               result.user,
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/change-password ──────────────────────────────────────────

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.changePassword({
      userId:          req.user!.id,
      currentPassword: req.body.currentPassword,
      newPassword:     req.body.newPassword,
    });
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
}
