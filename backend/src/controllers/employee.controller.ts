/**
 * backend/src/controllers/employee.controller.ts
 * Blocks 1, 2, 3 — list, profile get/patch, live status
 */
import type { Request, Response, NextFunction } from 'express';
import * as svc from '../services/employee.service';
import type { UserRole } from '@prisma/client';

export async function listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await svc.listEmployees(req.user!, {
      page:         req.query.page         ? Number(req.query.page)         : undefined,
      limit:        req.query.limit        ? Number(req.query.limit)        : undefined,
      search:       req.query.search       as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
      role:         req.query.role         as UserRole | undefined,
      isActive:     req.query.isActive !== undefined
                      ? req.query.isActive === 'true'
                      : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getEmployeeProfile(req.user!, req.params.id);
    res.json(data);
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.updateEmployeeProfile(req.user!, req.params.id, req.body);
    res.json({ message: 'Profile updated successfully.', data });
  } catch (err) { next(err); }
}

export async function getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getEmployeeStatus(req.user!, req.params.id);
    res.json(data);
  } catch (err) { next(err); }
}
