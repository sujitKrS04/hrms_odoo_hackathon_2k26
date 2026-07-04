/**
 * backend/src/controllers/payroll.controller.ts
 * Block 7
 */
import type { Request, Response, NextFunction } from 'express';
import * as svc from '../services/payroll.service';

export async function getPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getPayroll(req.user!, req.params.userId);
    res.json(data);
  } catch (err) { next(err); }
}

export async function updatePayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.updatePayroll(req.user!, req.params.userId, req.body);
    res.json({ message: 'Payroll structure updated successfully.', data });
  } catch (err) { next(err); }
}
