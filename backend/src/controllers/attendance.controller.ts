/**
 * backend/src/controllers/attendance.controller.ts
 * Blocks 4 & 5
 */
import type { Request, Response, NextFunction } from 'express';
import * as svc from '../services/attendance.service';

export async function checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // userId always comes from req.user — body is intentionally ignored
    const record = await svc.checkIn(req.user!.id);
    res.status(201).json({ message: 'Checked in successfully.', record });
  } catch (err) { next(err); }
}

export async function checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await svc.checkOut(req.user!.id);
    res.json({ message: 'Checked out successfully.', record });
  } catch (err) { next(err); }
}

export async function listAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await svc.listAttendance(req.user!, {
      userId:   req.query.userId   as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo:   req.query.dateTo   as string | undefined,
      page:     req.query.page  ? Number(req.query.page)  : undefined,
      limit:    req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
}
